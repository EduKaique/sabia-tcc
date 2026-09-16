package com.sabia.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
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
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        usuarioRepository.deleteAll();
        usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email("professor@sabia.edu")
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());
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
                .andExpect(jsonPath("$.erro").value("E-mail ou senha incorretos"));
    }

    @Test
    void login_comEmailInvalido_retorna400() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"nao-e-email","senha":""}"""))
                .andExpect(status().isBadRequest());
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
