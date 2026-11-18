package com.sabia.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.exception.PedagogicoIndisponivelException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.ProfessorRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET e PATCH /api/auth/perfil: edição do próprio nome (e avatar do aluno) e propagação ao pedagógico. */
@SpringBootTest
@ActiveProfiles("test")
class EdicaoPerfilControllerTest {

    private static final String EMAIL_ALUNO = "aluno@sabia.edu";
    private static final String EMAIL_PROFESSOR = "professor@sabia.edu";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private AlunoRepository alunoRepository;
    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private PedagogicoClient pedagogicoClient;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;
    private Long alunoId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        alunoRepository.deleteAll();
        professorRepository.deleteAll();
        usuarioRepository.deleteAll();

        Usuario aluno = usuarioRepository.save(Usuario.builder()
                .nome("Carlos Aluno")
                .email(EMAIL_ALUNO)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(aluno).matricula("2026001").avatar("sabia-azul").build());
        alunoId = aluno.getId();

        usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email(EMAIL_PROFESSOR)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());
    }

    private String logar(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("login", email).put("senha", "password").toString()))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private ResultActions editar(String email, String nome, String avatar) throws Exception {
        var corpo = json.createObjectNode().put("nome", nome);
        if (avatar != null) {
            corpo.put("avatar", avatar);
        }
        return mvc.perform(patch("/api/auth/perfil")
                .header("Authorization", "Bearer " + logar(email))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo.toString()));
    }

    private String nomeNoBanco(String email) {
        return usuarioRepository.findByEmailIgnoreCase(email).orElseThrow().getNome();
    }

    private String nomeNoToken(ResultActions resultado) throws Exception {
        JsonNode corpo = json.readTree(resultado.andReturn().getResponse().getContentAsString());
        return jwtTokenProvider.extractClaims(corpo.get("token").asText()).get("nome", String.class);
    }

    @Test
    void consultar_comoAluno_trazMatriculaEAvatar() throws Exception {
        mvc.perform(get("/api/auth/perfil").header("Authorization", "Bearer " + logar(EMAIL_ALUNO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Aluno"))
                .andExpect(jsonPath("$.email").value(EMAIL_ALUNO))
                .andExpect(jsonPath("$.perfil").value("ALUNO"))
                .andExpect(jsonPath("$.matricula").value("2026001"))
                .andExpect(jsonPath("$.avatar").value("sabia-azul"))
                .andExpect(jsonPath("$.cpf").doesNotExist());
    }

    @Test
    void consultar_comoProfessor_semMatriculaNemAvatar() throws Exception {
        mvc.perform(get("/api/auth/perfil").header("Authorization", "Bearer " + logar(EMAIL_PROFESSOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ana Professora"))
                .andExpect(jsonPath("$.perfil").value("PROFESSOR"))
                .andExpect(jsonPath("$.matricula").doesNotExist())
                .andExpect(jsonPath("$.avatar").doesNotExist())
                .andExpect(jsonPath("$.cpf").doesNotExist());
    }

    @Test
    void editar_comoAluno_salvaNomeEAvatarDevolveTokenNovoEPropagaUmaVez() throws Exception {
        var resultado = editar(EMAIL_ALUNO, "  Carlos Souza  ", "sabia-roxo")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Souza"))
                .andExpect(jsonPath("$.avatar").value("sabia-roxo"))
                .andExpect(jsonPath("$.aviso").doesNotExist());

        assertThat(nomeNoToken(resultado)).isEqualTo("Carlos Souza");
        assertThat(nomeNoBanco(EMAIL_ALUNO)).isEqualTo("Carlos Souza");
        assertThat(alunoRepository.findById(alunoId).orElseThrow().getAvatar()).isEqualTo("sabia-roxo");
        verify(pedagogicoClient).atualizarNomeAluno(alunoId, "Carlos Souza");
    }

    @Test
    void editar_comoAluno_semAvatar_mantemOAtual() throws Exception {
        editar(EMAIL_ALUNO, "Carlos Souza", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value("sabia-azul"));
    }

    @Test
    void editar_comoAluno_mesmoNome_naoChamaOPedagogico() throws Exception {
        editar(EMAIL_ALUNO, "Carlos Aluno", "sabia-verde").andExpect(status().isOk());

        verify(pedagogicoClient, never()).atualizarNomeAluno(anyLong(), anyString());
    }

    @Test
    void editar_comPedagogicoIndisponivel_salvaNomeEDevolveAviso() throws Exception {
        doThrow(new PedagogicoIndisponivelException(null))
                .when(pedagogicoClient).atualizarNomeAluno(anyLong(), anyString());

        editar(EMAIL_ALUNO, "Carlos Souza", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Souza"))
                .andExpect(jsonPath("$.aviso")
                        .value("Nome salvo; pode levar alguns minutos para aparecer nas atividades."));

        assertThat(nomeNoBanco(EMAIL_ALUNO)).isEqualTo("Carlos Souza");
    }

    @Test
    void editar_comoProfessor_salvaNomeSemChamarOPedagogico() throws Exception {
        var resultado = editar(EMAIL_PROFESSOR, "Ana Maria Professora", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ana Maria Professora"))
                .andExpect(jsonPath("$.avatar").doesNotExist());

        assertThat(nomeNoToken(resultado)).isEqualTo("Ana Maria Professora");
        assertThat(nomeNoBanco(EMAIL_PROFESSOR)).isEqualTo("Ana Maria Professora");
        verify(pedagogicoClient, never()).atualizarNomeAluno(anyLong(), anyString());
    }

    @Test
    void editar_comoProfessorComAvatar_retorna400NoCampoAvatar() throws Exception {
        editar(EMAIL_PROFESSOR, "Ana Professora", "sabia-azul")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.avatar").value("Avatar não se aplica ao perfil de professor."));
    }

    @Test
    void editar_comAvatarForaDoCatalogo_retorna400() throws Exception {
        editar(EMAIL_ALUNO, "Carlos Aluno", "avatar-1.png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.avatar").value("Avatar inválido."));

        assertThat(alunoRepository.findById(alunoId).orElseThrow().getAvatar()).isEqualTo("sabia-azul");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "Ab"})
    void editar_comNomeVazioOuCurto_retorna400(String nome) throws Exception {
        editar(EMAIL_ALUNO, nome, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());

        assertThat(nomeNoBanco(EMAIL_ALUNO)).isEqualTo("Carlos Aluno");
    }

    @Test
    void editar_comNomeDe256Caracteres_retorna400() throws Exception {
        editar(EMAIL_PROFESSOR, "a".repeat(256), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("O nome deve ter entre 3 e 255 caracteres."));
    }

    @Test
    void editar_semToken_eRecusado() throws Exception {
        // Sem entry point configurado, o auth-service responde 403 (como em /api/auth/me).
        mvc.perform(patch("/api/auth/perfil")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Alguém\"}"))
                .andExpect(status().isForbidden());
    }
}
