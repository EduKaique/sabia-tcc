package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.ProfessorLicaoService;
import com.sabia.pedagogico.service.licao.ProgressoLicaoProfessorService;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import java.time.LocalDateTime;
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
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
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

/** Rotas de lições do professor com a SecurityConfig real, serviço e validadores reais e repositórios falsos. */
@SpringJUnitWebConfig(ProfessorLicaoControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + ProfessorLicaoControllerTest.SEGREDO)
class ProfessorLicaoControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/professor/licoes";

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, ProfessorLicaoController.class, ProfessorLicaoService.class,
            ValidadorConteudoPagina.class, CenarioRoboValidador.class, ProgressoLicaoProfessorService.class})
    static class Config {
        @Bean
        JsonMapper objectMapper() {
            return JsonMapper.builder().build();
        }

        @Bean
        LicaoRepository licaoRepository() {
            return mock(LicaoRepository.class);
        }

        @Bean
        PaginaLicaoRepository paginaLicaoRepository() {
            return mock(PaginaLicaoRepository.class);
        }

        @Bean
        LicaoTurmaRepository licaoTurmaRepository() {
            return mock(LicaoTurmaRepository.class);
        }

        @Bean
        ProgressoPaginaRepository progressoPaginaRepository() {
            return mock(ProgressoPaginaRepository.class);
        }

        @Bean
        TurmaRepository turmaRepository() {
            return mock(TurmaRepository.class);
        }

        @Bean
        TurmaAlunoRepository turmaAlunoRepository() {
            return mock(TurmaAlunoRepository.class);
        }

        @Bean
        ProgressoLicaoRepository progressoLicaoRepository() {
            return mock(ProgressoLicaoRepository.class);
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private LicaoRepository licaoRepo;
    @Autowired
    private PaginaLicaoRepository paginaRepo;
    @Autowired
    private LicaoTurmaRepository vinculoRepo;
    @Autowired
    private TurmaAlunoRepository matriculaRepo;
    @Autowired
    private ProgressoPaginaRepository progressoPaginaRepo;
    @Autowired
    private ProgressoLicaoRepository progressoLicaoRepo;

    private MockMvc mockMvc;
    private Licao licao;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(licaoRepo, paginaRepo, vinculoRepo, matriculaRepo, progressoPaginaRepo, progressoLicaoRepo);
        licao = Licao.builder().id(1L).titulo("Algoritmos").conceito("Sequência")
                .modo(ModoPratica.BLOCOS).status(StatusLicao.ATIVA).professorId(5L).build();
        when(licaoRepo.findById(1L)).thenReturn(Optional.of(licao));
        when(licaoRepo.findById(99L)).thenReturn(Optional.empty());
        when(licaoRepo.save(any(Licao.class))).thenAnswer(inv -> {
            Licao l = inv.getArgument(0);
            if (l.getId() == null) l.setId(10L);
            return l;
        });
        when(paginaRepo.saveAll(anyList())).thenAnswer(inv -> {
            List<PaginaLicao> paginas = inv.getArgument(0);
            long id = 100;
            for (PaginaLicao p : paginas) if (p.getId() == null) p.setId(id++);
            return paginas;
        });
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(any())).thenReturn(List.of());
        when(vinculoRepo.findByLicaoId(any())).thenReturn(List.of());
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

    private ResultActions comoProfessor(long id, MockHttpServletRequestBuilder req) throws Exception {
        return mockMvc.perform(req.header("Authorization", "Bearer " + token(String.valueOf(id), "PROFESSOR")));
    }

    private static String salvar(String paginas) {
        return "{\"titulo\":\"Algoritmos\",\"conceito\":\"Sequência\",\"resumo\":null,\"modo\":\"BLOCOS\","
                + "\"cenarioJson\":null,\"paginas\":[" + paginas + "]}";
    }

    private static final String TEXTO = "{\"tipo\":\"TEXTO\",\"conteudo\":{\"html\":\"<p>oi</p>\"}}";

    @Test
    void professorCriaRascunho() throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"  Laços  \",\"conceito\":\"Repetição\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.estado").value("RASCUNHO"))
                .andExpect(jsonPath("$.titulo").value("Laços"))
                .andExpect(jsonPath("$.modo").value("BLOCOS"))
                .andExpect(jsonPath("$.paginas").isEmpty());
    }

    @Test
    void criarSemTemaOuComTituloCurtoResponde400ComCampos() throws Exception {
        comoProfessor(5, post(URL).contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"ab\",\"conceito\":\" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.titulo").exists())
                .andExpect(jsonPath("$.campos.conceito").exists());
        verify(licaoRepo, never()).save(any());
    }

    @Test
    void salvarDevolveOConteudoComoObjetoEOGabarito() throws Exception {
        String questionario = "{\"tipo\":\"QUESTIONARIO\",\"titulo\":\"Confira\",\"conteudo\":{\"perguntas\":"
                + "[{\"enunciado\":\"O que é?\",\"alternativas\":[\"a\",\"b\"],\"correta\":1}]}}";
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(TEXTO + "," + questionario)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paginas[0].conteudo.html").value("<p>oi</p>"))
                .andExpect(jsonPath("$.paginas[1].ordem").value(1))
                .andExpect(jsonPath("$.paginas[1].conteudo.percentualMinimo").value(70))
                .andExpect(jsonPath("$.paginas[1].conteudo.perguntas[0].correta").value(1));
    }

    @Test
    void conteudoInvalidoResponde400ComChavesDaPagina() throws Exception {
        String semAlt = "{\"tipo\":\"IMAGEM_TEXTO\",\"conteudo\":{\"imagemUrl\":\"http://exemplo.org/a.png\"}}";
        String videoRuim = "{\"tipo\":\"VIDEO_YOUTUBE\",\"conteudo\":{\"videoId\":\"https://evilyoutube.com/watch?v=dQw4w9WgXcQ\"}}";
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(TEXTO + "," + semAlt + "," + videoRuim)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Dados inválidos"))
                .andExpect(jsonPath("$.campos['paginas[1].alt']").exists())
                .andExpect(jsonPath("$.campos['paginas[1].imagemUrl']").exists())
                .andExpect(jsonPath("$.campos['paginas[2].videoId']").exists());
        verify(paginaRepo, never()).saveAll(anyList());
    }

    @Test
    void tituloDaPaginaLongoOuTipoAusenteResponde400() throws Exception {
        String longo = "{\"tipo\":\"TEXTO\",\"titulo\":\"" + "a".repeat(151) + "\",\"conteudo\":{\"html\":\"x\"}}";
        String semTipo = "{\"conteudo\":{\"html\":\"x\"}}";
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(longo + "," + semTipo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['paginas[0].titulo']").exists())
                .andExpect(jsonPath("$.campos['paginas[1].tipo']").exists());
    }

    @Test
    void maisDe30PaginasResponde400() throws Exception {
        String paginas = String.join(",", java.util.Collections.nCopies(31, TEXTO));
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(paginas)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.paginas").exists());
        String trinta = String.join(",", java.util.Collections.nCopies(30, TEXTO));
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(trinta)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paginas.length()").value(30));
    }

    @Test
    void videoUploadResponde422() throws Exception {
        comoProfessor(5, put(URL + "/1").contentType(MediaType.APPLICATION_JSON)
                .content(salvar("{\"tipo\":\"VIDEO_UPLOAD\",\"conteudo\":{}}")))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.erro").value("Upload de vídeo ainda não está disponível."));
    }

    @Test
    void publicarSemPaginaResponde422() throws Exception {
        comoProfessor(5, post(URL + "/1/publicar")).andExpect(status().is(422));
    }

    @Test
    void outroProfessorRecebe403EInexistente404() throws Exception {
        comoProfessor(6, get(URL + "/1")).andExpect(status().isForbidden());
        comoProfessor(6, put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(salvar(TEXTO)))
                .andExpect(status().isForbidden());
        comoProfessor(6, put(URL + "/1/turmas").contentType(MediaType.APPLICATION_JSON).content("{\"turmaIds\":[]}"))
                .andExpect(status().isForbidden());
        comoProfessor(6, post(URL + "/1/publicar")).andExpect(status().isForbidden());
        comoProfessor(6, delete(URL + "/1")).andExpect(status().isForbidden());
        comoProfessor(5, get(URL + "/99")).andExpect(status().isNotFound());
        verify(licaoRepo, never()).save(any());
    }

    @Test
    void arquivarResponde204() throws Exception {
        comoProfessor(5, delete(URL + "/1")).andExpect(status().isNoContent());
        comoProfessor(5, delete(URL + "/1")).andExpect(status().isNoContent());
        comoProfessor(5, get(URL + "/1")).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("ARQUIVADA"));
    }

    @Test
    void semTokenEhRecusado() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().is4xxClientError());
        mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"Laços\",\"conceito\":\"Repetição\"}")).andExpect(status().is4xxClientError());
        verify(licaoRepo, never()).save(any());
    }

    @Test
    void alunoRecebe403() throws Exception {
        String aluno = "Bearer " + token("7", "ALUNO");
        mockMvc.perform(get(URL).header("Authorization", aluno)).andExpect(status().isForbidden());
        mockMvc.perform(get(URL + "/1").header("Authorization", aluno)).andExpect(status().isForbidden());
        mockMvc.perform(post(URL).header("Authorization", aluno).contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"Laços\",\"conceito\":\"Repetição\"}")).andExpect(status().isForbidden());
        verify(licaoRepo, never()).save(any());
    }

    // ---------- relatório de progresso da lição ----------

    private void cenarioProgresso() {
        Turma turma = Turma.builder().id(10L).nome("5º A").professorId(5L).build();
        PaginaLicao pagina = PaginaLicao.builder().id(101L).licao(licao).ordem(0).tipo(TipoPagina.TEXTO)
                .titulo("Introdução").conteudoJson("{}").build();
        LocalDateTime t = LocalDateTime.of(2026, 11, 10, 9, 0);
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(pagina));
        when(vinculoRepo.findComTurmaByLicaoIdIn(any())).thenReturn(List.of(
                LicaoTurma.builder().licao(licao).turma(turma).vinculadaEm(t).build()));
        when(matriculaRepo.findByTurmaIdIn(any())).thenReturn(List.of(
                TurmaAluno.builder().turma(turma).alunoId(3L).alunoNome("Maria").ingressoEm(t).build()));
        when(progressoPaginaRepo.findByPaginaIdInAndAlunoIdIn(any(), any())).thenReturn(List.of(
                ProgressoPagina.builder().alunoId(3L).pagina(pagina).vistaEm(t).build()));
        when(progressoLicaoRepo.findByLicaoIdAndAlunoIdIn(any(), any())).thenReturn(List.of());
    }

    @Test
    void donoVeOProgressoDaLicaoPorTurmaEPagina() throws Exception {
        cenarioProgresso();
        comoProfessor(5, get(URL + "/1/progresso"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licao.id").value(1))
                .andExpect(jsonPath("$.licao.estado").value("RASCUNHO"))
                .andExpect(jsonPath("$.paginas[0].tipo").value("TEXTO"))
                .andExpect(jsonPath("$.totalAlunos").value(1))
                .andExpect(jsonPath("$.concluiram").value(0))
                .andExpect(jsonPath("$.turmas[0].turmaNome").value("5º A"))
                .andExpect(jsonPath("$.turmas[0].alunos[0].nome").value("Maria"))
                .andExpect(jsonPath("$.turmas[0].alunos[0].estado").value("PRATICA_LIBERADA"))
                .andExpect(jsonPath("$.turmas[0].alunos[0].paginas[0].concluida").value(true));
    }

    @Test
    void progressoSemEmailCpfNemMatricula() throws Exception {
        cenarioProgresso();
        String json = comoProfessor(5, get(URL + "/1/progresso")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        org.assertj.core.api.Assertions.assertThat(json.toLowerCase()).doesNotContain("email", "cpf", "matricula");
    }

    @Test
    void progressoDeOutroProfessor403EInexistente404() throws Exception {
        comoProfessor(6, get(URL + "/1/progresso")).andExpect(status().isForbidden());
        comoProfessor(5, get(URL + "/99/progresso")).andExpect(status().isNotFound());
        verify(matriculaRepo, never()).findByTurmaIdIn(any());
    }

    @Test
    void progressoRecusaAlunoESemToken() throws Exception {
        mockMvc.perform(get(URL + "/1/progresso").header("Authorization", "Bearer " + token("3", "ALUNO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(URL + "/1/progresso")).andExpect(status().is4xxClientError());
        verify(licaoRepo, never()).findById(any());
    }
}
