package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse.AlunoLinha;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse.Celula;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.service.LicaoService;
import com.sabia.pedagogico.service.RelogioManual;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Painel de progresso das lições da turma: matriz alunos x lições publicadas, com as mesmas regras de estado da
 * listagem do aluno e número fixo de consultas. O filtro de status, publicação e vínculo também está no JPQL.
 */
class PainelLicoesTurmaServiceTest {

    private static final long PROF = 5L;
    private static final long TURMA = 10L;
    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 10, 9, 0);

    private final TurmaRepository turmaRepo = mock(TurmaRepository.class);
    private final LicaoTurmaRepository vinculoRepo = mock(LicaoTurmaRepository.class);
    private final TurmaAlunoRepository matriculaRepo = mock(TurmaAlunoRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final PainelLicoesTurmaService service = new PainelLicoesTurmaService(turmaRepo, vinculoRepo,
            matriculaRepo, paginaRepo, progressoPaginaRepo, progressoRepo);

    private final Turma turma = Turma.builder().id(TURMA).nome("5º A").professorId(PROF).build();

    // ---------- construtores ----------

    private static Licao licao(long id, LocalDateTime publicadaEm) {
        return Licao.builder().id(id).titulo("Lição " + id).conceito("Conceito " + id)
                .modo(ModoAtividade.BLOCOS).status(StatusLicao.ATIVA).professorId(PROF).publicadaEm(publicadaEm)
                .build();
    }

    private LicaoTurma vinculo(Licao l) {
        return LicaoTurma.builder().licao(l).turma(turma).vinculadaEm(T).build();
    }

    private TurmaAluno aluno(long id, String nome) {
        return TurmaAluno.builder().id(id + 1000).turma(turma).alunoId(id).alunoNome(nome).ingressoEm(T).build();
    }

    private static PaginaLicao pagina(long id, Licao l, int ordem, TipoPagina tipo) {
        return PaginaLicao.builder().id(id).licao(l).ordem(ordem).tipo(tipo).conteudoJson("{}").build();
    }

    private static ProgressoPagina vista(long aluno, PaginaLicao p) {
        return ProgressoPagina.builder().alunoId(aluno).pagina(p).vistaEm(T).build();
    }

    private static ProgressoPagina questionario(long aluno, PaginaLicao p, int melhor, boolean aprovado) {
        return ProgressoPagina.builder().alunoId(aluno).pagina(p).tentativas(1).melhorPercentual(melhor)
                .aprovadoEm(aprovado ? T : null).build();
    }

    private static ProgressoLicao progressoLicao(long aluno, Licao l, LocalDateTime concluidaEm) {
        return ProgressoLicao.builder().alunoId(aluno).licao(l).atividadeConcluida(concluidaEm != null)
                .concluidaEm(concluidaEm).build();
    }

    private void cenario(List<Licao> licoes, List<TurmaAluno> alunos, List<PaginaLicao> paginas,
                         List<ProgressoPagina> pps, List<ProgressoLicao> pls) {
        when(turmaRepo.findByIdAndProfessorId(TURMA, PROF)).thenReturn(Optional.of(turma));
        when(vinculoRepo.findPublicadasDaTurma(TURMA)).thenReturn(licoes.stream().map(this::vinculo).toList());
        when(matriculaRepo.findByTurmaId(TURMA)).thenReturn(alunos);
        when(paginaRepo.findByLicaoIdIn(anyCollection())).thenReturn(paginas);
        when(progressoPaginaRepo.findDaTurmaPorPaginas(eq(TURMA), anyCollection())).thenReturn(pps);
        when(progressoRepo.findDaTurmaPorLicoes(eq(TURMA), anyCollection())).thenReturn(pls);
    }

    private static Celula celula(ProgressoLicoesTurmaResponse r, long alunoId, long licaoId) {
        AlunoLinha linha = r.alunos().stream().filter(a -> a.alunoId() == alunoId).findFirst().orElseThrow();
        return linha.celulas().stream().filter(c -> c.licaoId() == licaoId).findFirst().orElseThrow();
    }

    // ---------- acesso ----------

    @Test
    void turmaInexistenteOuDeOutroProfessorResponde404SemOutrasConsultas() {
        when(turmaRepo.findByIdAndProfessorId(TURMA, PROF)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.progresso(PROF, TURMA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Turma não encontrada.");
        verifyNoInteractions(vinculoRepo, matriculaRepo, paginaRepo, progressoPaginaRepo, progressoRepo);
    }

    // ---------- estados e páginas ----------

    @Test
    void matrizCalculaOsQuatroEstadosEAsPaginasConcluidasPorTipo() {
        Licao l = licao(1L, T);
        PaginaLicao texto = pagina(101L, l, 0, TipoPagina.TEXTO);
        PaginaLicao imagem = pagina(102L, l, 1, TipoPagina.IMAGEM_TEXTO);
        PaginaLicao video = pagina(103L, l, 2, TipoPagina.VIDEO_YOUTUBE);
        PaginaLicao quest = pagina(104L, l, 3, TipoPagina.QUESTIONARIO);
        cenario(List.of(l),
                List.of(aluno(1L, "Ana"), aluno(2L, "Bia"), aluno(3L, "Caio"), aluno(4L, "Duda"), aluno(5L, "Edu")),
                List.of(texto, imagem, video, quest),
                List.of(
                        // Ana: tudo concluído e a prática também
                        vista(1L, texto), vista(1L, imagem),
                        ProgressoPagina.builder().alunoId(1L).pagina(video).videoConferidoEm(T).build(),
                        questionario(1L, quest, 100, true),
                        // Bia: texto visto, vídeo só com pulsos (não conferido), questionário reprovado
                        vista(2L, texto),
                        ProgressoPagina.builder().alunoId(2L).pagina(video).segundosVideo(30).build(),
                        questionario(2L, quest, 40, false),
                        // Caio: todas as páginas, sem concluir a prática
                        vista(3L, texto), vista(3L, imagem),
                        ProgressoPagina.builder().alunoId(3L).pagina(video).videoConferidoEm(T).build(),
                        questionario(3L, quest, 80, true),
                        // Duda: vídeo "visto" (vistaEm) não conta; só videoConferidoEm conclui
                        ProgressoPagina.builder().alunoId(4L).pagina(video).vistaEm(T).build()),
                List.of(progressoLicao(1L, l, T.plusDays(1))));

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(celula(r, 1L, 1L)).isEqualTo(
                new Celula(1L, EstadoLicaoAluno.CONCLUIDA, 4, 100, true, T.plusDays(1)));
        assertThat(celula(r, 2L, 1L)).isEqualTo(
                new Celula(1L, EstadoLicaoAluno.EM_ANDAMENTO, 1, 40, false, null));
        assertThat(celula(r, 3L, 1L)).isEqualTo(
                new Celula(1L, EstadoLicaoAluno.PRATICA_LIBERADA, 4, 80, false, null));
        assertThat(celula(r, 4L, 1L)).isEqualTo(
                new Celula(1L, EstadoLicaoAluno.EM_ANDAMENTO, 0, null, false, null));
        // Edu: matriculado sem nenhum progresso
        assertThat(celula(r, 5L, 1L)).isEqualTo(
                new Celula(1L, EstadoLicaoAluno.NAO_INICIADA, 0, null, false, null));
        assertThat(r.licoes().get(0).concluiram()).isEqualTo(1);
        assertThat(r.licoes().get(0).totalPaginas()).isEqualTo(4);
        assertThat(r.totalAlunos()).isEqualTo(5);
        assertThat(r.turmaId()).isEqualTo(TURMA);
        assertThat(r.turmaNome()).isEqualTo("5º A");
    }

    @Test
    void autosaveDaPraticaSemPaginasConcluidasContaComoEmAndamento() {
        Licao l = licao(1L, T);
        PaginaLicao texto = pagina(101L, l, 0, TipoPagina.TEXTO);
        cenario(List.of(l), List.of(aluno(1L, "Ana")), List.of(texto), List.of(),
                List.of(progressoLicao(1L, l, null)));

        assertThat(celula(service.progresso(PROF, TURMA), 1L, 1L).estado()).isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
    }

    @Test
    void alunoQueSaiuDaTurmaNaoApareceMesmoComProgressoNoBanco() {
        Licao l = licao(1L, T);
        PaginaLicao texto = pagina(101L, l, 0, TipoPagina.TEXTO);
        // aluno 9 tem progresso, mas não está mais em turma_aluno
        cenario(List.of(l), List.of(aluno(1L, "Ana")), List.of(texto),
                List.of(vista(9L, texto)), List.of(progressoLicao(9L, l, T)));

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(r.alunos()).extracting(AlunoLinha::alunoId).containsExactly(1L);
        assertThat(r.licoes().get(0).concluiram()).isZero();
        assertThat(r.totalAlunos()).isEqualTo(1);
    }

    @Test
    void licaoRascunhoOuArquivadaNaoViraColunaEAConsultaEhPelaTurma() {
        Licao publicada = licao(1L, T);
        Licao rascunho = licao(2L, null);
        Licao arquivada = licao(3L, T);
        arquivada.setStatus(StatusLicao.INATIVA);
        cenario(List.of(publicada, rascunho, arquivada), List.of(aluno(1L, "Ana")), List.of(), List.of(), List.of());

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(r.licoes()).extracting("id").containsExactly(1L);
        assertThat(r.alunos().get(0).celulas()).extracting(Celula::licaoId).containsExactly(1L);
        // lição de outra turma ou sem vínculo: a consulta é sempre pelos vínculos desta turma
        verify(vinculoRepo).findPublicadasDaTurma(TURMA);
        verify(progressoRepo).findDaTurmaPorLicoes(TURMA, List.of(1L));
    }

    // ---------- ordem ----------

    @Test
    void colunasPorPublicacaoComEmpatePorIdELinhasPorNomeSemAcentoNemCaixa() {
        Licao a = licao(7L, T.plusDays(2));
        Licao b = licao(5L, T);
        Licao c = licao(3L, T);
        cenario(List.of(a, b, c),
                List.of(aluno(4L, "bruno"), aluno(2L, "Bruno"), aluno(3L, "Álvaro"), aluno(1L, "Carla"),
                        aluno(6L, "alice")),
                List.of(), List.of(), List.of());

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(r.licoes()).extracting("id").containsExactly(3L, 5L, 7L);
        assertThat(r.alunos()).extracting(AlunoLinha::nome)
                .containsExactly("alice", "Álvaro", "Bruno", "bruno", "Carla");
        assertThat(r.alunos()).extracting(AlunoLinha::alunoId).containsExactly(6L, 3L, 2L, 4L, 1L);
        for (AlunoLinha linha : r.alunos()) {
            assertThat(linha.celulas()).extracting(Celula::licaoId).containsExactly(3L, 5L, 7L);
        }
    }

    @Test
    void alunoSemNomeGravadoApareceComIdentificadorGenerico() {
        cenario(List.of(), List.of(aluno(8L, null)), List.of(), List.of(), List.of());

        assertThat(service.progresso(PROF, TURMA).alunos().get(0).nome()).isEqualTo("Aluno 8");
    }

    // ---------- concluíram e questionário ----------

    @Test
    void concluiramContaPorLicaoEMediaDosQuestionariosEhInteira() {
        Licao l1 = licao(1L, T);
        Licao l2 = licao(2L, T.plusDays(1));
        PaginaLicao q1 = pagina(101L, l1, 0, TipoPagina.QUESTIONARIO);
        PaginaLicao q2 = pagina(102L, l1, 1, TipoPagina.QUESTIONARIO);
        PaginaLicao q3 = pagina(103L, l1, 2, TipoPagina.QUESTIONARIO);
        PaginaLicao t2 = pagina(201L, l2, 0, TipoPagina.TEXTO);
        cenario(List.of(l1, l2), List.of(aluno(1L, "Ana"), aluno(2L, "Bia"), aluno(3L, "Caio")),
                List.of(q1, q2, q3, t2),
                List.of(
                        // Ana: tentou 2 de 3 questionários -> (100 + 75) / 2 = 87 (divisão inteira)
                        questionario(1L, q1, 100, true), questionario(1L, q2, 75, true),
                        // Bia: um só, reprovado
                        questionario(2L, q1, 33, false),
                        // Caio: página vista mas nenhum questionário -> nulo
                        vista(3L, t2)),
                List.of(progressoLicao(1L, l2, T), progressoLicao(3L, l2, T)));

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(celula(r, 1L, 1L).melhorPercentualQuestionario()).isEqualTo(87);
        assertThat(celula(r, 2L, 1L).melhorPercentualQuestionario()).isEqualTo(33);
        assertThat(celula(r, 3L, 1L).melhorPercentualQuestionario()).isNull();
        assertThat(celula(r, 1L, 2L).melhorPercentualQuestionario()).isNull();
        assertThat(r.licoes()).extracting("concluiram").containsExactly(0, 2);
    }

    // ---------- vazios ----------

    @Test
    void turmaSemLicoesListaOsAlunosComCelulasVazias() {
        cenario(List.of(), List.of(aluno(1L, "Ana"), aluno(2L, "Bia")), List.of(), List.of(), List.of());

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(r.licoes()).isEmpty();
        assertThat(r.alunos()).hasSize(2).allSatisfy(a -> assertThat(a.celulas()).isEmpty());
        verifyNoInteractions(paginaRepo, progressoPaginaRepo, progressoRepo);
    }

    @Test
    void turmaSemAlunosListaAsLicoesSemLinhas() {
        Licao l = licao(1L, T);
        cenario(List.of(l), List.of(), List.of(pagina(101L, l, 0, TipoPagina.TEXTO)), List.of(), List.of());

        ProgressoLicoesTurmaResponse r = service.progresso(PROF, TURMA);

        assertThat(r.alunos()).isEmpty();
        assertThat(r.totalAlunos()).isZero();
        assertThat(r.licoes()).extracting("id").containsExactly(1L);
        assertThat(r.licoes().get(0).concluiram()).isZero();
        verifyNoInteractions(progressoPaginaRepo, progressoRepo);
    }

    // ---------- sem N+1 ----------

    @Test
    void numeroDeConsultasNaoDependeDeAlunosNemDeLicoes() {
        for (int[] tamanho : new int[][]{{1, 1}, {40, 12}}) {
            TurmaRepository turmas = mock(TurmaRepository.class);
            LicaoTurmaRepository vinculos = mock(LicaoTurmaRepository.class);
            TurmaAlunoRepository matriculas = mock(TurmaAlunoRepository.class);
            PaginaLicaoRepository paginas = mock(PaginaLicaoRepository.class);
            ProgressoPaginaRepository pps = mock(ProgressoPaginaRepository.class);
            ProgressoLicaoRepository pls = mock(ProgressoLicaoRepository.class);
            PainelLicoesTurmaService s = new PainelLicoesTurmaService(turmas, vinculos, matriculas, paginas, pps, pls);

            List<Licao> licoes = new ArrayList<>();
            List<PaginaLicao> todasPaginas = new ArrayList<>();
            for (int i = 1; i <= tamanho[1]; i++) {
                Licao l = licao(i, T.plusHours(i));
                licoes.add(l);
                todasPaginas.add(pagina(100L * i + 1, l, 0, TipoPagina.TEXTO));
                todasPaginas.add(pagina(100L * i + 2, l, 1, TipoPagina.QUESTIONARIO));
            }
            List<TurmaAluno> alunos = new ArrayList<>();
            List<ProgressoPagina> progressoPaginas = new ArrayList<>();
            List<ProgressoLicao> progressoLicoes = new ArrayList<>();
            for (int a = 1; a <= tamanho[0]; a++) {
                alunos.add(aluno(a, "Aluno " + a));
                for (PaginaLicao p : todasPaginas) progressoPaginas.add(questionario(a, p, 50, false));
                for (Licao l : licoes) progressoLicoes.add(progressoLicao(a, l, null));
            }
            when(turmas.findByIdAndProfessorId(TURMA, PROF)).thenReturn(Optional.of(turma));
            when(vinculos.findPublicadasDaTurma(TURMA)).thenReturn(licoes.stream().map(this::vinculo).toList());
            when(matriculas.findByTurmaId(TURMA)).thenReturn(alunos);
            when(paginas.findByLicaoIdIn(anyCollection())).thenReturn(todasPaginas);
            when(pps.findDaTurmaPorPaginas(anyLong(), anyCollection())).thenReturn(progressoPaginas);
            when(pls.findDaTurmaPorLicoes(anyLong(), anyCollection())).thenReturn(progressoLicoes);

            ProgressoLicoesTurmaResponse r = s.progresso(PROF, TURMA);

            assertThat(r.alunos()).hasSize(tamanho[0]);
            assertThat(r.licoes()).hasSize(tamanho[1]);
            verify(turmas).findByIdAndProfessorId(TURMA, PROF);
            verify(vinculos).findPublicadasDaTurma(TURMA);
            verify(matriculas).findByTurmaId(TURMA);
            verify(paginas).findByLicaoIdIn(anyCollection());
            verify(pps).findDaTurmaPorPaginas(eq(TURMA), anyCollection());
            verify(pls).findDaTurmaPorLicoes(eq(TURMA), anyCollection());
            verifyNoMoreInteractions(turmas, vinculos, matriculas, paginas, pps, pls);
        }
    }

    // ---------- consistência com a visão do aluno ----------

    @Test
    void mesmosDadosDaoOMesmoEstadoEPaginasNaListagemDoAlunoENoPainel() {
        Licao l1 = licao(1L, T);
        Licao l2 = licao(2L, T.plusDays(1));
        Licao l3 = licao(3L, T.plusDays(2));
        Licao l4 = licao(4L, T.plusDays(3));
        Licao l5 = licao(5L, T.plusDays(4)); // sem páginas: liberada direto
        List<Licao> licoes = List.of(l1, l2, l3, l4, l5);
        PaginaLicao p11 = pagina(11L, l1, 0, TipoPagina.TEXTO);
        PaginaLicao p12 = pagina(12L, l1, 1, TipoPagina.QUESTIONARIO);
        PaginaLicao p21 = pagina(21L, l2, 0, TipoPagina.IMAGEM_TEXTO);
        PaginaLicao p22 = pagina(22L, l2, 1, TipoPagina.VIDEO_YOUTUBE);
        PaginaLicao p31 = pagina(31L, l3, 0, TipoPagina.TEXTO);
        PaginaLicao p41 = pagina(41L, l4, 0, TipoPagina.QUESTIONARIO);
        List<PaginaLicao> paginas = List.of(p11, p12, p21, p22, p31, p41);
        long aluno = 7L;
        List<ProgressoPagina> pps = List.of(vista(aluno, p11), questionario(aluno, p12, 90, true),
                vista(aluno, p21), ProgressoPagina.builder().alunoId(aluno).pagina(p22).segundosVideo(10).build(),
                questionario(aluno, p41, 20, false));
        // l1 concluída; l2 e l4 em andamento; l3 sem nada; l5 sem páginas (prática liberada)
        List<ProgressoLicao> pls = List.of(progressoLicao(aluno, l1, T));

        // visão do aluno (L2)
        LicaoTurmaRepository vinculoAluno = mock(LicaoTurmaRepository.class);
        PaginaLicaoRepository paginaAluno = mock(PaginaLicaoRepository.class);
        ProgressoLicaoRepository plAluno = mock(ProgressoLicaoRepository.class);
        ProgressoPaginaRepository ppAluno = mock(ProgressoPaginaRepository.class);
        LicaoService licaoService = new LicaoService(mock(LicaoRepository.class), vinculoAluno, paginaAluno, plAluno,
                ppAluno, new ConteudoPaginaLeitor(JsonMapper.builder().build()), mock(ValidadorPratica.class),
                new RelogioManual(Instant.parse("2026-11-17T12:00:00Z")));
        when(vinculoAluno.findVisiveisParaAluno(aluno)).thenReturn(licoes.stream().map(this::vinculo).toList());
        when(paginaAluno.findByLicaoIdIn(anyCollection())).thenReturn(paginas);
        when(ppAluno.findByAlunoIdAndPaginaIdIn(eq(aluno), anyCollection())).thenReturn(pps);
        when(plAluno.findByAlunoIdAndLicaoIdIn(eq(aluno), anyCollection())).thenReturn(pls);
        Map<Long, LicaoResumoResponse> doAluno = licaoService.listarParaAluno(aluno).stream()
                .collect(Collectors.toMap(LicaoResumoResponse::id, Function.identity()));

        // painel do professor
        cenario(licoes, List.of(aluno(aluno, "Gabi")), paginas, pps, pls);
        List<Celula> celulas = service.progresso(PROF, TURMA).alunos().get(0).celulas();

        assertThat(celulas).hasSize(5);
        for (Celula c : celulas) {
            LicaoResumoResponse resumo = doAluno.get(c.licaoId());
            assertThat(c.estado()).as("estado da lição %d", c.licaoId()).isEqualTo(resumo.estado());
            assertThat(c.paginasConcluidas()).as("páginas da lição %d", c.licaoId())
                    .isEqualTo(resumo.paginasConcluidas());
            assertThat(c.atividadeConcluida()).isEqualTo(resumo.atividadeConcluida());
            assertThat(c.concluidaEm()).isEqualTo(resumo.concluidaEm());
        }
        // os quatro estados aparecem no cenário
        assertThat(celulas).extracting(Celula::estado).containsExactly(EstadoLicaoAluno.CONCLUIDA,
                EstadoLicaoAluno.EM_ANDAMENTO, EstadoLicaoAluno.NAO_INICIADA, EstadoLicaoAluno.EM_ANDAMENTO,
                EstadoLicaoAluno.PRATICA_LIBERADA);
    }
}
