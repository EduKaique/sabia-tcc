package com.sabia.auth;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class TrocarSenhaControllerTest {

    private static final String EMAIL = "professor@sabia.edu";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;
    private Long usuarioId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        usuarioRepository.deleteAll();
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email(EMAIL)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .mustChangePassword(true)
                .build());
        usuarioId = usuario.getId();
    }

    private String logar() throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"password"}"""))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    @Test
    void login_comMustChangePasswordTrue_exposeAFlag() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"password"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));
    }

    @Test
    void trocarSenha_comCredenciaisValidas_alteraSenhaEZeraFlag() throws Exception {
        String token = logar();

        mvc.perform(post("/api/auth/trocar-senha")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"senhaAtual":"password","novaSenha":"novaSenha123","confirmarSenha":"novaSenha123"}"""))
                .andExpect(status().isOk());

        assertThat(usuarioRepository.findById(usuarioId).orElseThrow().isMustChangePassword()).isFalse();

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"novaSenha123"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false));
    }

    @Test
    void trocarSenha_semToken_retorna403() throws Exception {
        mvc.perform(post("/api/auth/trocar-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"senhaAtual":"password","novaSenha":"novaSenha123","confirmarSenha":"novaSenha123"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void trocarSenha_comSenhaAtualIncorreta_retorna401() throws Exception {
        String token = logar();

        mvc.perform(post("/api/auth/trocar-senha")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"senhaAtual":"errada","novaSenha":"novaSenha123","confirmarSenha":"novaSenha123"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Senha atual incorreta."));
    }

    @Test
    void trocarSenha_comSenhasDivergentes_retorna422() throws Exception {
        String token = logar();

        mvc.perform(post("/api/auth/trocar-senha")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"senhaAtual":"password","novaSenha":"novaSenha123","confirmarSenha":"outraSenha123"}"""))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.erro").value("As senhas não coincidem."));
    }
}
