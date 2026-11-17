package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.dto.response.ConclusaoAtividadeResponse;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.LicaoService;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Corpo do concluir-atividade e dono do progresso (alunoId do token). */
@SpringJUnitWebConfig(AlunoLicaoConcluirControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + AlunoLicaoConcluirControllerTest.SEGREDO)
class AlunoLicaoConcluirControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/aluno/licoes/1/concluir-atividade";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, AlunoLicaoController.class})
    static class Config {
        @Bean
        LicaoService licaoService() {
            return mock(LicaoService.class);
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private LicaoService licaoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(licaoService);
    }

    private static String token(String alunoId) {
        long agora = System.currentTimeMillis();
        return Jwts.builder().subject(alunoId).claim("role", "ALUNO").claim("nome", "Ana")
                .issuedAt(new Date(agora)).expiration(new Date(agora + 60_000))
                .signWith(Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private ResultActions comoAluno(String alunoId, MockHttpServletRequestBuilder req) throws Exception {
        return mockMvc.perform(req.header("Authorization", "Bearer " + token(alunoId)));
    }

    @Test
    void semCorpoOuComProjetoVazioDevolve400() throws Exception {
        comoAluno("7", post(URL)).andExpect(status().isBadRequest());
        comoAluno("7", post(URL).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estadoJson").value("Envie o projeto para concluir a prática."));
        comoAluno("7", post(URL).contentType(MediaType.APPLICATION_JSON).content("{\"estadoJson\":\"  \"}"))
                .andExpect(status().isBadRequest());

        verify(licaoService, never()).concluirAtividade(anyLong(), anyLong(), anyString());
    }

    @Test
    void projetoAcimaDe64KbDevolve400() throws Exception {
        comoAluno("7", post(URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estadoJson\":\"" + "x".repeat(65_537) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.estadoJson").value("O projeto passa do limite de 64 KB."));

        verify(licaoService, never()).concluirAtividade(anyLong(), anyLong(), anyString());
    }

    @Test
    void usaOAlunoDoTokenEDevolveOVeredito() throws Exception {
        when(licaoService.concluirAtividade(8L, 1L, "{\"blocks\":{}}"))
                .thenReturn(new ConclusaoAtividadeResponse(false, false, false, null, null));

        comoAluno("8", post(URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estadoJson\":\"{\\\"blocks\\\":{}}\",\"alunoId\":99}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atividadeConcluida").value(false));

        verify(licaoService).concluirAtividade(8L, 1L, "{\"blocks\":{}}");
    }
}
