package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.config.JwtConfig;
import com.sabia.pedagogico.config.SecurityConfig;
import com.sabia.pedagogico.exception.GlobalExceptionHandler;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.security.JwtAuthFilter;
import com.sabia.pedagogico.security.JwtTokenReader;
import com.sabia.pedagogico.service.licao.PainelLicoesTurmaService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Painel de progresso das lições da turma com a SecurityConfig real, serviço real e repositórios falsos. */
@SpringJUnitWebConfig(ProfessorTurmaLicoesControllerTest.Config.class)
@TestPropertySource(properties = "sabia.jwt.secret=" + ProfessorTurmaLicoesControllerTest.SEGREDO)
class ProfessorTurmaLicoesControllerTest {

    static final String SEGREDO = "test-secret-test-secret-test-secret-test-secret";
    private static final String URL = "/api/professor/turmas/10/licoes/progresso";
    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 10, 9, 0);

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, JwtAuthFilter.class, JwtTokenReader.class, JwtConfig.class,
            GlobalExceptionHandler.class, ProfessorTurmaLicoesController.class, PainelLicoesTurmaService.class})
    static class Config {
        @Bean
        JsonMapper objectMapper() {
            return JsonMapper.builder().build();
        }

        @Bean
        TurmaRepository turmaRepository() {
            return mock(TurmaRepository.class);
        }

        @Bean
        LicaoTurmaRepository licaoTurmaRepository() {
            return mock(LicaoTurmaRepository.class);
        }

        @Bean
        TurmaAlunoRepository turmaAlunoRepository() {
            return mock(TurmaAlunoRepository.class);
        }

        @Bean
        PaginaLicaoRepository paginaLicaoRepository() {
            return mock(PaginaLicaoRepository.class);
        }

        @Bean
        ProgressoPaginaRepository progressoPaginaRepository() {
            return mock(ProgressoPaginaRepository.class);
        }

        @Bean
        ProgressoLicaoRepository progressoLicaoRepository() {
            return mock(ProgressoLicaoRepository.class);
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private TurmaRepository turmaRepo;
    @Autowired
    private LicaoTurmaRepository vinculoRepo;
    @Autowired
    private TurmaAlunoRepository matriculaRepo;
    @Autowired
    private PaginaLicaoRepository paginaRepo;
    @Autowired
    private ProgressoPaginaRepository progressoPaginaRepo;
    @Autowired
    private ProgressoLicaoRepository progressoRepo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        reset(turmaRepo, vinculoRepo, matriculaRepo, paginaRepo, progressoPaginaRepo, progressoRepo);
        Turma turma = Turma.builder().id(10L).nome("5º A").professorId(5L).build();
        Licao licao = Licao.builder().id(1L).titulo("Algoritmos").conceito("Sequência").modo(ModoAtividade.BLOCOS)
                .status(StatusLicao.ATIVA).professorId(5L).publicadaEm(T).build();
        PaginaLicao pagina = PaginaLicao.builder().id(101L).licao(licao).ordem(0).tipo(TipoPagina.TEXTO)
                .conteudoJson("{}").build();
        when(turmaRepo.findByIdAndProfessorId(10L, 5L)).thenReturn(Optional.of(turma));
        when(turmaRepo.findByIdAndProfessorId(eq(99L), anyLong())).thenReturn(Optional.empty());
        when(vinculoRepo.findPublicadasDaTurma(10L)).thenReturn(List.of(
                LicaoTurma.builder().licao(licao).turma(turma).vinculadaEm(T).build()));
        when(matriculaRepo.findByTurmaId(10L)).thenReturn(List.of(
                TurmaAluno.builder().id(1L).turma(turma).alunoId(7L).alunoNome("Maria").ingressoEm(T).build()));
        when(paginaRepo.findByLicaoIdIn(anyCollection())).thenReturn(List.of(pagina));
        when(progressoPaginaRepo.findDaTurmaPorPaginas(eq(10L), anyCollection())).thenReturn(List.of(
                ProgressoPagina.builder().alunoId(7L).pagina(pagina).vistaEm(T).build()));
        when(progressoRepo.findDaTurmaPorLicoes(eq(10L), anyCollection())).thenReturn(List.of());
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

    private static String bearer(long id, String role) {
        return "Bearer " + token(String.valueOf(id), role);
    }

    @Test
    void semTokenEhRecusado() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().is4xxClientError());
        verify(turmaRepo, never()).findByIdAndProfessorId(anyLong(), anyLong());
    }

    @Test
    void alunoRecebe403() throws Exception {
        mockMvc.perform(get(URL).header("Authorization", bearer(7L, "ALUNO"))).andExpect(status().isForbidden());
        verify(turmaRepo, never()).findByIdAndProfessorId(anyLong(), anyLong());
    }

    @Test
    void professorDonoRecebeAMatriz() throws Exception {
        mockMvc.perform(get(URL).header("Authorization", bearer(5L, "PROFESSOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.turmaId").value(10))
                .andExpect(jsonPath("$.turmaNome").value("5º A"))
                .andExpect(jsonPath("$.totalAlunos").value(1))
                .andExpect(jsonPath("$.licoes[0].id").value(1))
                .andExpect(jsonPath("$.licoes[0].titulo").value("Algoritmos"))
                .andExpect(jsonPath("$.licoes[0].modo").value("BLOCOS"))
                .andExpect(jsonPath("$.licoes[0].totalPaginas").value(1))
                .andExpect(jsonPath("$.licoes[0].concluiram").value(0))
                .andExpect(jsonPath("$.alunos[0].alunoId").value(7))
                .andExpect(jsonPath("$.alunos[0].nome").value("Maria"))
                .andExpect(jsonPath("$.alunos[0].celulas[0].licaoId").value(1))
                .andExpect(jsonPath("$.alunos[0].celulas[0].estado").value("PRATICA_LIBERADA"))
                .andExpect(jsonPath("$.alunos[0].celulas[0].paginasConcluidas").value(1))
                .andExpect(jsonPath("$.alunos[0].celulas[0].melhorPercentualQuestionario").doesNotExist())
                .andExpect(jsonPath("$.alunos[0].celulas[0].atividadeConcluida").value(false));
        verify(turmaRepo).findByIdAndProfessorId(10L, 5L);
    }

    @Test
    void turmaDeOutroProfessorResponde404ComOIdDoToken() throws Exception {
        when(turmaRepo.findByIdAndProfessorId(10L, 6L)).thenReturn(Optional.empty());

        mockMvc.perform(get(URL).header("Authorization", bearer(6L, "PROFESSOR")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Turma não encontrada."));
        verify(turmaRepo).findByIdAndProfessorId(10L, 6L);
        verify(vinculoRepo, never()).findPublicadasDaTurma(anyLong());
    }

    @Test
    void turmaInexistenteResponde404() throws Exception {
        mockMvc.perform(get("/api/professor/turmas/99/licoes/progresso")
                        .header("Authorization", bearer(5L, "PROFESSOR")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Turma não encontrada."));
    }

    @Test
    void parametroDeProfessorNaURLEhIgnoradoValeOToken() throws Exception {
        when(turmaRepo.findByIdAndProfessorId(10L, 6L)).thenReturn(Optional.empty());

        mockMvc.perform(get(URL).param("professorId", "5").header("Authorization", bearer(6L, "PROFESSOR")))
                .andExpect(status().isNotFound());
        verify(turmaRepo).findByIdAndProfessorId(10L, 6L);
        verify(turmaRepo, never()).findByIdAndProfessorId(10L, 5L);
    }

    @Test
    void respostaNaoExpoeEmailCpfNemMatricula() throws Exception {
        String json = mockMvc.perform(get(URL).header("Authorization", bearer(5L, "PROFESSOR")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(json.toLowerCase()).doesNotContain("email", "e-mail", "cpf", "matricula", "matrícula");
    }
}
