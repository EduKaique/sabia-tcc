package com.sabia.auth;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerTest {

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
        usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email("professor@sabia.edu")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());
        Usuario aluno = usuarioRepository.save(Usuario.builder()
                .nome("Beatriz Souza")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(aluno).matricula("2026AB01").build());
    }

    private ResultActions logar(String corpo) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    @Test
    void login_comCredenciaisValidas_retorna200EToken() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"password"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.perfil").value("PROFESSOR"))
                .andExpect(jsonPath("$.nome").value("Ana Professora"));
    }

    @Test
    void login_comSenhaIncorreta_retorna401Generico() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"errada"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Dados de acesso incorretos"));
    }

    @Test
    void login_comCamposVazios_retorna400() throws Exception {
        logar("""
                {"login":"","senha":""}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.login").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void login_porCampoLogin_comEmailEmMaiusculas_retorna200() throws Exception {
        logar("""
                {"login":" Professor@SABIA.edu ","senha":"password"}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("PROFESSOR"));
    }

    @Test
    void login_porMatricula_comEspacosEMinusculas_retorna200Aluno() throws Exception {
        logar("""
                {"login":"  2026ab01 ","senha":"password"}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("ALUNO"))
                .andExpect(jsonPath("$.nome").value("Beatriz Souza"));
    }

    @Test
    void login_porMatricula_comSenhaIncorreta_retorna401Neutro() throws Exception {
        logar("""
                {"login":"2026AB01","senha":"errada"}""")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Dados de acesso incorretos"));
    }

    @Test
    void login_comIdentificadorQueNaoEhMatricula_retorna401() throws Exception {
        // CPF do professor não é matrícula: professor só entra por e-mail.
        logar("""
                {"login":"12345678901","senha":"password"}""")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Dados de acesso incorretos"));
    }

    @Test
    void me_alunoSemEmail_retornaUsuarioAutenticado() throws Exception {
        String body = logar("""
                {"login":"2026AB01","senha":"password"}""")
                .andReturn().getResponse().getContentAsString();
        String token = json.readTree(body).get("token").asText();

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("ALUNO"));
    }

    @Test
    void email_continuaObrigatorioParaProfessorEAdministrador() {
        for (PerfilUsuario perfil : new PerfilUsuario[]{PerfilUsuario.PROFESSOR, PerfilUsuario.ADMINISTRADOR}) {
            Usuario semEmail = Usuario.builder()
                    .nome("Sem e-mail")
                    .cpf(perfil == PerfilUsuario.PROFESSOR ? "11111111111" : "22222222222")
                    .senhaHash(passwordEncoder.encode("password"))
                    .tipoPerfil(perfil)
                    .build();

            assertThatThrownBy(() -> usuarioRepository.saveAndFlush(semEmail))
                    .rootCause()
                    .hasMessageContaining("E-mail é obrigatório");
        }
    }

    @Test
    void me_comTokenValido_retornaUsuarioAutenticado() throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"password"}"""))
                .andReturn().getResponse().getContentAsString();
        String token = json.readTree(body).get("token").asText();

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("professor@sabia.edu"))
                .andExpect(jsonPath("$.perfil").value("PROFESSOR"));
    }

    @Test
    void me_semToken_retorna403() throws Exception {
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validate_comTokenValido_retornaValidoTrue() throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"password"}"""))
                .andReturn().getResponse().getContentAsString();
        JsonNode login = json.readTree(body);

        mvc.perform(post("/api/auth/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("token", login.get("token").asText()).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valido").value(true))
                .andExpect(jsonPath("$.perfil").value("PROFESSOR"));
    }

    @Test
    void validate_comTokenAdulterado_retornaValidoFalse() throws Exception {
        mvc.perform(post("/api/auth/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"token":"abc.def.ghi"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valido").value(false));
    }
}
