package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.AtividadeAvaliativaService;
import com.sabia.pedagogico.service.SubmissaoAvaliativaService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Entrada da entrega: limite de 64 KB e JSON ilegível viram 400 no formato padrão. */
@SpringJUnitWebConfig(AlunoAtividadeSubmeterControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + AlunoAtividadeSubmeterControllerTest.SEGREDO)
class AlunoAtividadeSubmeterControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/aluno/atividades/10/submeter";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, AlunoAtividadeController.class})
    static class Config {
        @Bean
        AtividadeAvaliativaService atividadeAvaliativaService() {
            return mock(AtividadeAvaliativaService.class);
        }

        @Bean
        SubmissaoAvaliativaService submissaoAvaliativaService() {
            return mock(SubmissaoAvaliativaService.class);
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private SubmissaoAvaliativaService submissaoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(submissaoService);
    }

    private static String token() {
        long agora = System.currentTimeMillis();
        return Jwts.builder().subject("7").claim("role", "ALUNO").claim("nome", "Ana")
                .issuedAt(new Date(agora)).expiration(new Date(agora + 60_000))
                .signWith(Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private ResultActions enviar(String corpo) throws Exception {
        return mockMvc.perform(post(URL).header("Authorization", "Bearer " + token())
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    @Test
    void projetoAcimaDe64KbDevolve400SemChamarOServico() throws Exception {
        String grande = "x".repeat(65_537);
        enviar("{\"estadoJson\":\"" + grande + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estadoJson").value("O projeto passa do limite de 64 KB."));

        verify(submissaoService, never()).submeter(anyLong(), anyString(), anyLong(), any());
    }

    @Test
    void projetoVazioDevolve400() throws Exception {
        enviar("{\"estadoJson\":\"\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estadoJson").exists());
        enviar("{}").andExpect(status().isBadRequest());
    }

    @Test
    void jsonIlegivelDevolve400NoFormatoPadrao() throws Exception {
        when(submissaoService.submeter(anyLong(), anyString(), anyLong(), any()))
                .thenThrow(new EstadoPraticaInvalidoException("O projeto enviado não é um JSON válido."));

        enviar("{\"estadoJson\":\"{quebrado\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.erro").value("O projeto enviado não é um JSON válido."));
    }
}
