package com.sabia.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.auth.model.recuperacaosenha.TokenRecuperacaoSenha;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.TokenRecuperacaoSenhaRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.service.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class RecuperacaoSenhaControllerTest {

    private static final String EMAIL = "professor@sabia.edu";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private TokenRecuperacaoSenhaRepository tokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        tokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email(EMAIL)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());
    }

    @Test
    void esqueciSenha_comEmailExistente_retorna200EEnviaEmail() throws Exception {
        mvc.perform(post("/api/auth/esqueci-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").isNotEmpty());

        verify(emailService).enviarLinkRecuperacaoSenha(eq(EMAIL), eq("Ana Professora"), anyString());
        assertThat(tokenRepository.findAll()).hasSize(1);
    }

    @Test
    void esqueciSenha_comEmailInexistente_retorna200ComMesmaMensagemSemEnviarEmail() throws Exception {
        String respostaExistente = mvc.perform(post("/api/auth/esqueci-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu"}"""))
                .andReturn().getResponse().getContentAsString();

        String respostaInexistente = mvc.perform(post("/api/auth/esqueci-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"nao-existe@sabia.edu"}"""))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(respostaInexistente).isEqualTo(respostaExistente);
        verify(emailService, never()).enviarLinkRecuperacaoSenha(eq("nao-existe@sabia.edu"), anyString(), anyString());
    }

    @Test
    void redefinirSenha_fluxoCompleto_permiteLoginComSenhaNova() throws Exception {
        String token = solicitarTokenRecuperacao(EMAIL);

        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir(token, "novaSenha123", "novaSenha123")))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"professor@sabia.edu","senha":"novaSenha123"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void redefinirSenha_comTokenReutilizado_retorna410() throws Exception {
        String token = solicitarTokenRecuperacao(EMAIL);
        String corpo = corpoRedefinir(token, "novaSenha123", "novaSenha123");

        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().is(410))
                .andExpect(jsonPath("$.erro").value("Este link já foi utilizado."));
    }

    @Test
    void redefinirSenha_comTokenExpirado_retorna410() throws Exception {
        String token = solicitarTokenRecuperacao(EMAIL);
        TokenRecuperacaoSenha registro = tokenRepository.findAll().get(0);
        registro.setExpiraEm(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        tokenRepository.save(registro);

        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir(token, "novaSenha123", "novaSenha123")))
                .andExpect(status().is(410))
                .andExpect(jsonPath("$.erro").value("Este link expirou."));
    }

    @Test
    void redefinirSenha_comSenhasDivergentes_retorna422() throws Exception {
        String token = solicitarTokenRecuperacao(EMAIL);

        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir(token, "novaSenha123", "outraSenha123")))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.erro").value("As senhas não coincidem."));
    }

    @Test
    void redefinirSenha_comTokenInexistente_retorna422() throws Exception {
        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir("token-que-nao-existe", "novaSenha123", "novaSenha123")))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.erro").value("Link inválido."));
    }

    @Test
    void redefinirSenha_invalidaOutrosTokensAtivosDoUsuario() throws Exception {
        String token1 = solicitarTokenRecuperacao(EMAIL);
        String token2 = solicitarTokenRecuperacao(EMAIL);

        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir(token2, "novaSenha123", "novaSenha123")))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoRedefinir(token1, "outraSenha123", "outraSenha123")))
                .andExpect(status().is(410));
    }

    private String corpoRedefinir(String token, String novaSenha, String confirmarSenha) {
        return json.createObjectNode()
                .put("token", token)
                .put("novaSenha", novaSenha)
                .put("confirmarSenha", confirmarSenha)
                .toString();
    }

    private String solicitarTokenRecuperacao(String email) throws Exception {
        reset(emailService);
        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);

        mvc.perform(post("/api/auth/esqueci-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", email).toString()))
                .andExpect(status().isOk());

        verify(emailService).enviarLinkRecuperacaoSenha(eq(email), anyString(), linkCaptor.capture());
        String link = linkCaptor.getValue();
        return link.substring(link.indexOf("token=") + "token=".length());
    }
}
