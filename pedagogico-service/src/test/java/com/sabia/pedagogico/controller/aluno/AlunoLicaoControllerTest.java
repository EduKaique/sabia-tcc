package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.LicaoService;
import com.sabia.pedagogico.service.ProgressoPaginaService;
import com.sabia.pedagogico.service.RelogioManual;
import com.sabia.pedagogico.service.licao.ConteudoPaginaLeitor;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Rotas do aluno com a SecurityConfig real e os serviços reais (repositórios mock): papel, aluno do token,
 * corpos inválidos e, principalmente, que o gabarito do questionário nunca sai no JSON.
 */
@SpringJUnitWebConfig(AlunoLicaoControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + AlunoLicaoControllerTest.SEGREDO)
class AlunoLicaoControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/aluno/licoes";
    /** Gabarito com a 3ª alternativa ("Gamma") certa; nada disso pode aparecer na resposta do aluno. */
    private static final String QUESTIONARIO = "{\"percentualMinimo\":70,\"perguntas\":["
            + "{\"enunciado\":\"Qual?\",\"alternativas\":[\"Alfa\",\"Beta\",\"Gamma\"],\"correta\":2},"
            + "{\"enunciado\":\"E esta?\",\"alternativas\":[\"Sim\",\"Não\"],\"correta\":0}]}";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, AlunoLicaoController.class, LicaoService.class,
            ProgressoPaginaService.class, ConteudoPaginaLeitor.class, ValidadorPratica.class,
            CenarioRoboValidador.class})
    static class Config {
        @Bean JsonMapper objectMapper() { return JsonMapper.builder().build(); }
        @Bean Clock relogio() { return new RelogioManual(Instant.parse("2026-11-17T12:00:00Z")); }
        @Bean LicaoRepository licaoRepository() { return mock(LicaoRepository.class); }
        @Bean LicaoTurmaRepository licaoTurmaRepository() { return mock(LicaoTurmaRepository.class); }
        @Bean PaginaLicaoRepository paginaLicaoRepository() { return mock(PaginaLicaoRepository.class); }
        @Bean ProgressoLicaoRepository progressoLicaoRepository() { return mock(ProgressoLicaoRepository.class); }
        @Bean ProgressoPaginaRepository progressoPaginaRepository() { return mock(ProgressoPaginaRepository.class); }
    }

    @Autowired private WebApplicationContext context;
    @Autowired private LicaoRepository licaoRepo;
    @Autowired private LicaoTurmaRepository vinculoRepo;
    @Autowired private PaginaLicaoRepository paginaRepo;
    @Autowired private ProgressoLicaoRepository progressoRepo;
    @Autowired private ProgressoPaginaRepository progressoPaginaRepo;
    private final JsonMapper mapper = JsonMapper.builder().build();

    private MockMvc mockMvc;
    private final Map<String, ProgressoPagina> linhas = new HashMap<>();
    private Licao licao;
    private PaginaLicao texto;
    private PaginaLicao questionario;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(licaoRepo, vinculoRepo, paginaRepo, progressoRepo, progressoPaginaRepo);
        linhas.clear();
        licao = Licao.builder().id(1L).titulo("Laços").conceito("Repetição").modo(ModoPratica.BLOCOS)
                .status(StatusLicao.ATIVA).professorId(2L).publicadaEm(LocalDateTime.of(2026, 11, 1, 0, 0)).build();
        texto = PaginaLicao.builder().id(10L).licao(licao).ordem(0).tipo(TipoPagina.TEXTO)
                .conteudoJson("{\"html\":\"<p>Oi</p>\"}").build();
        questionario = PaginaLicao.builder().id(11L).licao(licao).ordem(1).tipo(TipoPagina.QUESTIONARIO)
                .titulo("Confira").conteudoJson(QUESTIONARIO).build();

        when(licaoRepo.findVisivelParaAluno(1L, 7L)).thenReturn(Optional.of(licao));
        when(vinculoRepo.findVisiveisParaAluno(7L)).thenReturn(List.of(LicaoTurma.builder().licao(licao)
                .turma(Turma.builder().id(10L).nome("Turma A").build()).build()));
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto, questionario));
        when(paginaRepo.findByLicaoIdIn(any())).thenReturn(List.of(texto, questionario));
        when(paginaRepo.findById(10L)).thenReturn(Optional.of(texto));
        when(paginaRepo.findById(11L)).thenReturn(Optional.of(questionario));
        when(progressoRepo.findByAlunoIdAndLicaoId(any(), any())).thenReturn(Optional.empty());
        when(progressoRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(progressoPaginaRepo.criarSeAusente(anyLong(), anyLong())).thenAnswer(inv -> {
            Long aluno = inv.getArgument(0);
            Long pagina = inv.getArgument(1);
            linhas.putIfAbsent(aluno + ":" + pagina, ProgressoPagina.builder().alunoId(aluno)
                    .pagina(pagina == 10L ? texto : questionario).build());
            return 1;
        });
        when(progressoPaginaRepo.buscarParaAtualizar(anyLong(), anyLong()))
                .thenAnswer(inv -> Optional.ofNullable(linhas.get(inv.getArgument(0) + ":" + inv.getArgument(1))));
        when(progressoPaginaRepo.findByAlunoIdAndPaginaIdIn(anyLong(), any())).thenAnswer(inv -> linhas.values()
                .stream().filter(l -> l.getAlunoId().equals(inv.getArgument(0))).toList());
    }

    private static String token(String sub, String role) {
        long agora = System.currentTimeMillis();
        return Jwts.builder().subject(sub).claim("role", role).claim("nome", "Ana")
                .issuedAt(new Date(agora)).expiration(new Date(agora + 60_000))
                .signWith(Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private ResultActions como(String sub, String role, MockHttpServletRequestBuilder req) throws Exception {
        return mockMvc.perform(req.header("Authorization", "Bearer " + token(sub, role)));
    }

    private ResultActions comoAluno(MockHttpServletRequestBuilder req) throws Exception {
        return como("7", "ALUNO", req);
    }

    private static MockHttpServletRequestBuilder respostas(String json) {
        return post(URL + "/1/paginas/11/questionario").contentType(MediaType.APPLICATION_JSON).content(json);
    }

    // ---------- gabarito ----------

    @Test
    void detalheNuncaTrazOGabaritoDoQuestionario() throws Exception {
        String corpo = comoAluno(get(URL + "/1")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(corpo).doesNotContain("correta").doesNotContain("conteudoJson").doesNotContain("gabarito");
        JsonNode raiz = mapper.readTree(corpo);
        JsonNode conteudo = raiz.get("paginas").get(1).get("conteudo");
        assertThat(conteudo.propertyNames()).containsExactlyInAnyOrder("percentualMinimo", "perguntas");
        for (JsonNode pergunta : conteudo.get("perguntas")) {
            assertThat(pergunta.propertyNames()).containsExactlyInAnyOrder("enunciado", "alternativas");
        }
        assertThat(conteudo.get("perguntas").get(0).get("alternativas").size()).isEqualTo(3);
        assertThat(raiz.get("paginas").get(1).get("progresso").propertyNames())
                .containsExactlyInAnyOrder("concluida", "questionario");
        assertThat(raiz.get("paginas").get(0).get("conteudo").get("html").stringValue()).isEqualTo("<p>Oi</p>");
        // Campos legados saíram da resposta do aluno.
        assertThat(raiz.has("videoId")).isFalse();
        assertThat(raiz.has("conteudo")).isFalse();
        assertThat(raiz.get("estado").stringValue()).isEqualTo("NAO_INICIADA");
        assertThat(raiz.get("praticaLiberada").booleanValue()).isFalse();
    }

    @Test
    void correcaoDizSoSeCadaPerguntaEstaCerta() throws Exception {
        String corpo = comoAluno(respostas("{\"respostas\":[2,1]}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.acertos").value(1))
                .andExpect(jsonPath("$.percentual").value(50))
                .andExpect(jsonPath("$.aprovado").value(false))
                .andExpect(jsonPath("$.perguntas[0].certa").value(true))
                .andExpect(jsonPath("$.perguntas[1].certa").value(false))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(corpo).doesNotContain("correta").doesNotContain("Gamma").doesNotContain("alternativa");
        for (JsonNode p : mapper.readTree(corpo).get("perguntas")) {
            assertThat(p.propertyNames()).containsExactly("certa");
        }
    }

    // ---------- papéis e token ----------

    @Test
    void semTokenEhRecusado() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().is4xxClientError());
        mockMvc.perform(post(URL + "/1/paginas/10/vista")).andExpect(status().is4xxClientError());
        mockMvc.perform(post(URL + "/1/paginas/11/video/pulso")).andExpect(status().is4xxClientError());
        mockMvc.perform(respostas("{\"respostas\":[2,0]}")).andExpect(status().is4xxClientError());
        verify(progressoPaginaRepo, never()).criarSeAusente(anyLong(), anyLong());
    }

    @Test
    void professorRecebe403NasRotasDoAluno() throws Exception {
        como("2", "PROFESSOR", get(URL)).andExpect(status().isForbidden());
        como("2", "PROFESSOR", get(URL + "/1")).andExpect(status().isForbidden());
        como("2", "PROFESSOR", post(URL + "/1/paginas/10/vista")).andExpect(status().isForbidden());
        como("2", "PROFESSOR", post(URL + "/1/paginas/11/video/pulso")).andExpect(status().isForbidden());
        como("2", "PROFESSOR", respostas("{\"respostas\":[2,0]}")).andExpect(status().isForbidden());
        como("2", "PROFESSOR", put(URL + "/1/estado").contentType(MediaType.APPLICATION_JSON)
                .content("{\"estadoJson\":\"{}\"}")).andExpect(status().isForbidden());
        verify(progressoPaginaRepo, never()).criarSeAusente(anyLong(), anyLong());
    }

    @Test
    void alunoRecebeRespostasEsperadas() throws Exception {
        comoAluno(get(URL)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].estado").value("NAO_INICIADA"))
                .andExpect(jsonPath("$[0].totalPaginas").value(2))
                .andExpect(jsonPath("$[0].turmas[0].nome").value("Turma A"));
        comoAluno(post(URL + "/1/paginas/10/vista")).andExpect(status().isOk())
                .andExpect(jsonPath("$.paginaId").value(10))
                .andExpect(jsonPath("$.concluida").value(true))
                .andExpect(jsonPath("$.praticaLiberada").value(false));
        comoAluno(post(URL + "/1/paginas/10/video/pulso")).andExpect(status().isUnprocessableContent());
        comoAluno(post(URL + "/1/concluir-atividade").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estadoJson\":\"{\\\"blocks\\\":{}}\"}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.erro").value("Conclua o conteúdo da lição antes da prática."));
        comoAluno(respostas("{\"respostas\":[2,0]}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.aprovadoNaPagina").value(true))
                .andExpect(jsonPath("$.praticaLiberada").value(true));
        comoAluno(get(URL + "/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PRATICA_LIBERADA"))
                .andExpect(jsonPath("$.praticaLiberada").value(true));
        comoAluno(get(URL + "/2")).andExpect(status().isNotFound());
        comoAluno(post(URL + "/2/paginas/10/vista")).andExpect(status().isNotFound());
    }

    @Test
    void usaOAlunoDoTokenEOutroAlunoNaoVeALicao() throws Exception {
        como("8", "ALUNO", get(URL + "/1")).andExpect(status().isNotFound());
        como("8", "ALUNO", post(URL + "/1/paginas/10/vista")).andExpect(status().isNotFound());
        como("8", "ALUNO", get(URL)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

        comoAluno(respostas("{\"respostas\":[2,0],\"alunoId\":8}")).andExpect(status().isOk());
        assertThat(linhas).containsOnlyKeys("7:11");
    }

    // ---------- corpo do questionário ----------

    @Test
    void corpoDoQuestionarioInvalidoResponde400() throws Exception {
        comoAluno(post(URL + "/1/paginas/11/questionario")).andExpect(status().isBadRequest());
        comoAluno(respostas("{}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.respostas").exists());
        comoAluno(respostas("{\"respostas\":[2,null]}")).andExpect(status().isBadRequest());
        comoAluno(respostas("{\"respostas\":\"x\"}")).andExpect(status().isBadRequest());
        comoAluno(respostas("{\"respostas\":[2]}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.respostas").exists());
        comoAluno(respostas("{\"respostas\":[2,5]}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['respostas[1]']").exists());
        comoAluno(respostas("{\"respostas\":[0,0,0,0,0,0,0,0,0,0,0]}")).andExpect(status().isBadRequest());
        assertThat(linhas).isEmpty();
    }

    @Test
    void questionarioEmPaginaDeTextoResponde422() throws Exception {
        comoAluno(post(URL + "/1/paginas/10/questionario").contentType(MediaType.APPLICATION_JSON)
                .content("{\"respostas\":[0]}")).andExpect(status().isUnprocessableContent());
    }
}
