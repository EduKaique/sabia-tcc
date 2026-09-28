package com.sabia.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class PerfilControllerTest {

    private static final String EMAIL_ALUNO = "aluno@sabia.edu";
    private static final String EMAIL_PROFESSOR = "professor@sabia.edu";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private AlunoRepository alunoRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        alunoRepository.deleteAll();
        usuarioRepository.deleteAll();

        Usuario aluno = usuarioRepository.save(Usuario.builder()
                .nome("Carlos Aluno")
                .cpf("98765432100")
                .email(EMAIL_ALUNO)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(aluno).build());

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
                        .content(json.createObjectNode().put("email", email).put("senha", "password").toString()))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private String corpoPerfil(String cpf, String matricula) {
        return json.createObjectNode()
                .put("nomeCompleto", "Carlos Aluno Completo")
                .put("cpf", cpf)
                .put("matricula", matricula)
                .put("avatar", "avatar-1.png")
                .toString();
    }

    @Test
    void status_comPerfilIncompleto_retornaFalse() throws Exception {
        String token = logar(EMAIL_ALUNO);

        mvc.perform(get("/api/auth/perfil/status").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfilCompleto").value(false));
    }

    @Test
    void atualizarPerfil_comDadosValidos_completaPerfil() throws Exception {
        String token = logar(EMAIL_ALUNO);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("98765432100", "2026001")))
                .andExpect(status().isOk());

        mvc.perform(get("/api/auth/perfil/status").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfilCompleto").value(true));
    }

    @Test
    void status_paraProfessor_retornaSempreTrue() throws Exception {
        String token = logar(EMAIL_PROFESSOR);

        mvc.perform(get("/api/auth/perfil/status").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfilCompleto").value(true));
    }

    @Test
    void atualizarPerfil_paraProfessor_retorna403() throws Exception {
        String token = logar(EMAIL_PROFESSOR);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("12345678101", "2026002")))
                .andExpect(status().isForbidden());
    }

    @Test
    void atualizarPerfil_comMesmoCpfDuasVezes_naoConflitaComSiMesmo() throws Exception {
        String token = logar(EMAIL_ALUNO);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("98765432100", "2026003")))
                .andExpect(status().isOk());

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("98765432100", "2026003")))
                .andExpect(status().isOk());
    }

    @Test
    void atualizarPerfil_comCpfJaCadastradoPorOutroUsuario_retorna409() throws Exception {
        usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("55555555555")
                .email("outra-professora@sabia.edu")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());

        String token = logar(EMAIL_ALUNO);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("55555555555", "2026003")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("CPF já cadastrado."));
    }

    @Test
    void atualizarPerfil_comMatriculaJaUsadaPorOutroAluno_retorna409() throws Exception {
        Usuario outroAluno = usuarioRepository.save(Usuario.builder()
                .nome("Outro Aluno")
                .cpf("11111111111")
                .email("outro-aluno@sabia.edu")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(outroAluno).matricula("2026999").build());

        String token = logar(EMAIL_ALUNO);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoPerfil("98765432100", "2026999")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Matrícula já cadastrada."));
    }

    @Test
    void atualizarPerfil_comCamposObrigatoriosFaltando_retorna400() throws Exception {
        String token = logar(EMAIL_ALUNO);

        mvc.perform(put("/api/auth/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nomeCompleto":"","cpf":"","matricula":"","avatar":""}"""))
                .andExpect(status().isBadRequest());
    }
}
