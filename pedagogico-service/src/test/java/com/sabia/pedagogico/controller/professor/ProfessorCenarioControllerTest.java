package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.model.robo.CenarioSalvo;
import com.sabia.pedagogico.repository.CenarioSalvoRepository;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.CenarioSalvoService;
import com.sabia.pedagogico.service.CenarioRoboValidador;
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
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Rotas de cenários do professor com a SecurityConfig real, serviço e validador reais e repositório falso. */
@SpringJUnitWebConfig(ProfessorCenarioControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + ProfessorCenarioControllerTest.SEGREDO)
class ProfessorCenarioControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/professor/cenarios";
    private static final String VALIDO = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\"]}";
    private static final String IMPOSSIVEL = "{\"versao\":1,\"linhas\":3,\"colunas\":3,"
            + "\"inicio\":{\"linha\":2,\"coluna\":2},\"destino\":{\"linha\":0,\"coluna\":0},"
            + "\"obstaculos\":[{\"linha\":0,\"coluna\":1},{\"linha\":1,\"coluna\":0}],"
            + "\"blocosPermitidos\":[\"robo_mover\"]}";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, ProfessorCenarioController.class, CenarioSalvoService.class})
    static class Config {
        @Bean
        CenarioSalvoRepository cenarioSalvoRepository() {
            return mock(CenarioSalvoRepository.class);
        }

        @Bean
        CenarioRoboValidador cenarioRoboValidador() {
            return new CenarioRoboValidador(JsonMapper.builder().build());
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private CenarioSalvoRepository repo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(repo);
        when(repo.save(any(CenarioSalvo.class))).thenAnswer(inv -> {
            CenarioSalvo c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });
        when(repo.saveAndFlush(any(CenarioSalvo.class))).thenAnswer(inv -> inv.getArgument(0));
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

    private static String corpo(String nome, String cenarioJson) {
        String nomeJson = nome == null ? "null" : "\"" + nome + "\"";
        String cenario = cenarioJson.replace("\"", "\\\"");
        return "{\"nome\":" + nomeJson + ",\"cenarioJson\":\"" + cenario + "\"}";
    }

    private ResultActions comoProfessor(long id, MockHttpServletRequestBuilder req) throws Exception {
        return mockMvc.perform(req.header("Authorization", "Bearer " + token(String.valueOf(id), "PROFESSOR")));
    }

    private static CenarioSalvo doProfessor(long professorId) {
        LocalDateTime agora = LocalDateTime.now();
        return CenarioSalvo.builder().id(1L).professorId(professorId).nome("Labirinto").cenarioJson(VALIDO)
                .criadoEm(agora).atualizadoEm(agora).build();
    }

    @Test
    void professorCriaCenarioValido() throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo(" Labirinto ", VALIDO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Labirinto"))
                .andExpect(jsonPath("$.cenarioJson").value(VALIDO));
    }

    @Test
    void cenarioImpossivelDevolve400ComAMensagem() throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo("Sem saída", IMPOSSIVEL)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("O cenário não tem caminho do início ao destino."));

        when(repo.findByIdAndProfessorId(1L, 5L)).thenReturn(Optional.of(doProfessor(5L)));
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(corpo("Sem saída", IMPOSSIVEL)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("O cenário não tem caminho do início ao destino."));

        verify(repo, never()).save(any());
        verify(repo, never()).saveAndFlush(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "ab", "  ab  "})
    void nomeVazioOuCurtoDevolve400NoCampoNome(String nome) throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo(nome, VALIDO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());
        verify(repo, never()).save(any());
    }

    @Test
    void nomeLongoOuAusenteDevolve400() throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo("a".repeat(101), VALIDO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("O nome do cenário deve ter entre 3 e 100 caracteres."));
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo(null, VALIDO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").value("O nome do cenário é obrigatório."));
    }

    @Test
    void cenarioDeOutroProfessorDevolve404() throws Exception {
        when(repo.findByIdAndProfessorId(1L, 6L)).thenReturn(Optional.empty());

        comoProfessor(6, get(URL + "/1")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Cenário não encontrado."));
        comoProfessor(6, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(corpo("Invasor", VALIDO)))
                .andExpect(status().isNotFound());
        comoProfessor(6, delete(URL + "/1")).andExpect(status().isNotFound());
        verify(repo, never()).delete(any(CenarioSalvo.class));
    }

    @Test
    void limiteDeCinquentaDevolve409() throws Exception {
        when(repo.countByProfessorId(5L)).thenReturn(50L);

        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo("Mais um", VALIDO)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void excluirDevolve204EDepois404() throws Exception {
        when(repo.findByIdAndProfessorId(1L, 5L)).thenReturn(Optional.of(doProfessor(5L)), Optional.empty());

        comoProfessor(5, delete(URL + "/1")).andExpect(status().isNoContent());
        comoProfessor(5, get(URL + "/1")).andExpect(status().isNotFound());
    }

    @Test
    void semTokenEhRecusado() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().is4xxClientError());
        mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo("Labirinto", VALIDO)))
                .andExpect(status().is4xxClientError());
        verify(repo, never()).save(any());
    }

    @Test
    void alunoRecebe403() throws Exception {
        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token("7", "ALUNO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(URL).header("Authorization", "Bearer " + token("7", "ALUNO"))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("Labirinto", VALIDO)))
                .andExpect(status().isForbidden());
        verify(repo, never()).save(any());
    }
}
