package com.sabia.pedagogico.controller.interno;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.AlunoNomeService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Rota interna de nome do aluno com a SecurityConfig real (só token SISTEMA), sem banco. */
@SpringJUnitWebConfig(InternoAlunoControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + InternoAlunoControllerTest.SEGREDO)
class InternoAlunoControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/interno/alunos/7/nome";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, InternoAlunoController.class})
    static class Config {
        @Bean
        AlunoNomeService alunoNomeService() {
            return mock(AlunoNomeService.class);
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private AlunoNomeService alunoNomeService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(alunoNomeService);
    }

    private static String token(String sub, String role) {
        long agora = System.currentTimeMillis();
        return Jwts.builder()
                .subject(sub)
                .claim("role", role)
                .claim("nome", "teste")
                .issuedAt(new Date(agora))
                .expiration(new Date(agora + 60_000))
                .signWith(Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private static MockHttpServletRequestBuilder requisicao(String nome) {
        String corpo = nome == null ? "{}" : "{\"nome\":\"" + nome + "\"}";
        return put(URL).contentType(MediaType.APPLICATION_JSON).content(corpo);
    }

    private ResultActions comoSistema(String nome) throws Exception {
        return mockMvc.perform(requisicao(nome).header("Authorization", "Bearer " + token("0", "SISTEMA")));
    }

    @Test
    void sistemaAtualizaONomeSemEspacosNasPontas() throws Exception {
        comoSistema("  Ana Souza  ").andExpect(status().isNoContent());

        verify(alunoNomeService).atualizarNome(7L, "Ana Souza");
    }

    @Test
    void repetirOMesmoNomeContinuaDevolvendo204() throws Exception {
        comoSistema("Ana Souza").andExpect(status().isNoContent());
        comoSistema("Ana Souza").andExpect(status().isNoContent());

        verify(alunoNomeService, times(2)).atualizarNome(7L, "Ana Souza");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "An"})
    void nomeVazioOuCurtoDevolve400NoCampoNome(String nome) throws Exception {
        comoSistema(nome)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.campos.nome").exists());

        verify(alunoNomeService, never()).atualizarNome(anyLong(), anyString());
    }

    @Test
    void nomeCom256CaracteresDevolve400() throws Exception {
        comoSistema("a".repeat(256))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("O nome deve ter entre 3 e 255 caracteres."));
    }

    @Test
    void nomeAusenteDevolve400() throws Exception {
        comoSistema(null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("O nome é obrigatório."));
    }

    @Test
    void semTokenEhRecusado() throws Exception {
        mockMvc.perform(requisicao("Ana Souza")).andExpect(status().is4xxClientError());

        verify(alunoNomeService, never()).atualizarNome(anyLong(), anyString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"ALUNO", "PROFESSOR"})
    void tokenDeUsuarioEhRecusado(String role) throws Exception {
        mockMvc.perform(requisicao("Ana Souza").header("Authorization", "Bearer " + token("7", role)))
                .andExpect(status().isForbidden());

        verify(alunoNomeService, never()).atualizarNome(anyLong(), anyString());
    }
}
