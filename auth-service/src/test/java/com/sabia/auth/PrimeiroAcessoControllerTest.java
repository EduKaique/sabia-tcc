package com.sabia.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.client.PedagogicoClient.TurmaConvite;
import com.sabia.auth.exception.CodigoTurmaInvalidoException;
import com.sabia.auth.exception.PedagogicoIndisponivelException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.TokenRecuperacaoSenhaRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class PrimeiroAcessoControllerTest {

    private static final String MSG_CODIGO_INVALIDO = "Código de turma inválido. Verifique com seu professor.";
    private static final TurmaConvite TURMA = new TurmaConvite(10L, "Programação I — 2025/1");

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private AlunoRepository alunoRepository;
    @Autowired
    private TokenRecuperacaoSenhaRepository tokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private PedagogicoClient pedagogicoClient;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        tokenRepository.deleteAll();
        alunoRepository.deleteAll();
        usuarioRepository.deleteAll();
        when(pedagogicoClient.buscarTurmaPorCodigo("SABIA1")).thenReturn(TURMA);
    }

    private ObjectNode corpo() {
        return json.createObjectNode()
                .put("codigoTurma", " sabia1 ")
                .put("nomeCompleto", " Maria Souza ")
                .put("matricula", " 2026a100 ")
                .put("dataNascimento", "2015-03-10")
                .put("avatar", "sabia-azul")
                .put("senha", "senhaForte1")
                .put("confirmarSenha", "senhaForte1");
    }

    private ResultActions enviar(ObjectNode corpo) throws Exception {
        return mvc.perform(post("/api/auth/primeiro-acesso")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo.toString()));
    }

    private void assertNadaCriado() {
        assertThat(usuarioRepository.count()).isZero();
        assertThat(alunoRepository.count()).isZero();
    }

    private Usuario salvarAluno(String matricula) {
        Usuario u = usuarioRepository.save(Usuario.builder()
                .nome("Aluno Existente")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(u).matricula(matricula).build());
        return u;
    }

    @Test
    void primeiroAcesso_comDadosValidos_retorna201TokenEPersisteAlunoSemCpfESemEmail() throws Exception {
        String body = enviar(corpo())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.role").value("ALUNO"))
                .andExpect(jsonPath("$.nome").value("Maria Souza"))
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andExpect(jsonPath("$.turma.nome").value("Programação I — 2025/1"))
                .andReturn().getResponse().getContentAsString();

        Aluno aluno = alunoRepository.findByMatricula("2026A100").orElseThrow();
        Usuario usuario = aluno.getUsuario();
        assertThat(usuario.getEmail()).isNull();
        assertThat(usuario.getCpf()).isNull();
        assertThat(usuario.getTipoPerfil()).isEqualTo(PerfilUsuario.ALUNO);
        assertThat(usuario.getDataNascimento()).isEqualTo(LocalDate.of(2015, 3, 10));
        assertThat(passwordEncoder.matches("senhaForte1", usuario.getSenhaHash())).isTrue();

        assertThat(aluno.getMatricula()).isEqualTo("2026A100");
        assertThat(aluno.getAvatar()).isEqualTo("sabia-azul");
        assertThat(aluno.isPerfilCompleto()).isTrue();
        assertThat(aluno.getPontuacaoGeral()).isZero();

        verify(pedagogicoClient).matricular(10L, usuario.getId(), "Maria Souza");

        String token = json.readTree(body).get("token").asText();
        assertThat(jwtTokenProvider.extractUserId(token)).isEqualTo(usuario.getId());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ALUNO"));
    }

    @Test
    void primeiroAcesso_comCodigoInexistente_retorna404SemCriarNada() throws Exception {
        when(pedagogicoClient.buscarTurmaPorCodigo("ZZZZZZ")).thenThrow(new CodigoTurmaInvalidoException());

        enviar(corpo().put("codigoTurma", "zzzzzz"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value(MSG_CODIGO_INVALIDO));

        assertNadaCriado();
        verify(pedagogicoClient, never()).matricular(anyLong(), anyLong(), anyString());
    }

    @Test
    void primeiroAcesso_comCodigoForaDoFormato_retorna404SemChamarPedagogico() throws Exception {
        enviar(corpo().put("codigoTurma", "SAB-A!"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value(MSG_CODIGO_INVALIDO));

        assertNadaCriado();
        verifyNoInteractions(pedagogicoClient);
    }

    @Test
    void primeiroAcesso_comFalhaNaMatricula_fazRollbackERetorna503() throws Exception {
        doThrow(new PedagogicoIndisponivelException(new RuntimeException("timeout")))
                .when(pedagogicoClient).matricular(eq(10L), anyLong(), any());

        enviar(corpo())
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.erro").value("Não foi possível concluir agora. Tente novamente."));

        assertNadaCriado();
    }

    @Test
    void primeiroAcesso_comPedagogicoIndisponivelNaBusca_retorna503SemCriarNada() throws Exception {
        when(pedagogicoClient.buscarTurmaPorCodigo("SABIA1"))
                .thenThrow(new PedagogicoIndisponivelException(new RuntimeException("connection refused")));

        enviar(corpo()).andExpect(status().isServiceUnavailable());

        assertNadaCriado();
    }

    @Test
    void primeiroAcesso_comMatriculaJaCadastradaEmOutraCaixa_retorna409CampoMatricula() throws Exception {
        salvarAluno("2026A100");

        enviar(corpo())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.campos.matricula").value("Matrícula já cadastrada."));

        assertThat(usuarioRepository.count()).isEqualTo(1);
        verify(pedagogicoClient, never()).matricular(anyLong(), anyLong(), anyString());
    }

    @Test
    void primeiroAcesso_comArrobaNaMatricula_retorna400CampoMatricula() throws Exception {
        enviar(corpo().put("matricula", "maria@escola"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.matricula").value("A matrícula não pode conter @."));

        assertNadaCriado();
        verifyNoInteractions(pedagogicoClient);
    }

    @Test
    void primeiroAcesso_comAvatarForaDoCatalogo_retorna400CampoAvatar() throws Exception {
        enviar(corpo().put("avatar", "avatar-1.png"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.avatar").exists());

        assertNadaCriado();
        verifyNoInteractions(pedagogicoClient);
    }

    @Test
    void primeiroAcesso_comSenhasDivergentes_retorna422() throws Exception {
        enviar(corpo().put("confirmarSenha", "outraSenha1"))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.erro").value("As senhas não coincidem."));

        assertNadaCriado();
    }

    @Test
    void primeiroAcesso_comDataDeNascimentoFutura_retorna400() throws Exception {
        enviar(corpo().put("dataNascimento", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.dataNascimento").exists());

        assertNadaCriado();
    }

    @Test
    void primeiroAcesso_comDataDeNascimentoHaMaisDe120Anos_retorna400() throws Exception {
        enviar(corpo().put("dataNascimento", LocalDate.now().minusYears(121).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.dataNascimento").exists());

        assertNadaCriado();
    }

    @Test
    void primeiroAcesso_comCamposObrigatoriosFaltando_retorna400PorCampo() throws Exception {
        mvc.perform(post("/api/auth/primeiro-acesso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.codigoTurma").exists())
                .andExpect(jsonPath("$.campos.nomeCompleto").exists())
                .andExpect(jsonPath("$.campos.matricula").exists())
                .andExpect(jsonPath("$.campos.dataNascimento").exists())
                .andExpect(jsonPath("$.campos.avatar").exists())
                .andExpect(jsonPath("$.campos.email").doesNotExist())
                .andExpect(jsonPath("$.campos.senha").exists())
                .andExpect(jsonPath("$.campos.confirmarSenha").exists());

        assertNadaCriado();
    }

    @Test
    void login_aposPrimeiroAcesso_pelaMatriculaEmMinusculas_retorna200() throws Exception {
        enviar(corpo()).andExpect(status().isCreated());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode()
                                .put("login", "2026a100")
                                .put("senha", "senhaForte1").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ALUNO"));
    }

    @Test
    void cpf_continuaObrigatorioParaProfessorEAdministrador() {
        for (PerfilUsuario perfil : new PerfilUsuario[]{PerfilUsuario.PROFESSOR, PerfilUsuario.ADMINISTRADOR}) {
            Usuario semCpf = Usuario.builder()
                    .nome("Sem CPF")
                    .email(perfil.name().toLowerCase() + "@sabia.edu")
                    .senhaHash(passwordEncoder.encode("password"))
                    .tipoPerfil(perfil)
                    .build();

            assertThatThrownBy(() -> usuarioRepository.saveAndFlush(semCpf))
                    .rootCause()
                    .hasMessageContaining("CPF é obrigatório");
        }
        assertThat(usuarioRepository.count()).isZero();
    }

    @Test
    void cpf_naoPodeSerRemovidoDeProfessorExistente() {
        Usuario professor = usuarioRepository.saveAndFlush(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email("professor@sabia.edu")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());

        professor.setCpf(null);

        assertThatThrownBy(() -> usuarioRepository.saveAndFlush(professor))
                .rootCause()
                .hasMessageContaining("CPF é obrigatório");
    }

    @Test
    void tokenDeServico_naoAutenticaNoAuthServiceENaoEhValidadoComoSessao() throws Exception {
        String tokenSistema = jwtTokenProvider.generateServiceToken();

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenSistema))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("token", tokenSistema).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valido").value(false));
    }
}
