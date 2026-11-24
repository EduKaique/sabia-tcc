package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.AlunoProgresso;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.PaginaAluno;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.TurmaProgresso;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicao;
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
import com.sabia.pedagogico.service.LicaoService;
import com.sabia.pedagogico.service.RelogioManual;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Relatório da lição (professor): alunos das turmas vinculadas por turma, resumo com as regras da visão do aluno,
 * situação página a página, contagens sem duplicar aluno e número fixo de consultas.
 */
class ProgressoLicaoProfessorServiceTest {

    private static final long PROF = 5L;
    private static final long LICAO = 1L;
    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 10, 9, 0);

    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final LicaoTurmaRepository vinculoRepo = mock(LicaoTurmaRepository.class);
    private final TurmaAlunoRepository matriculaRepo = mock(TurmaAlunoRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final ProgressoLicaoProfessorService service = new ProgressoLicaoProfessorService(licaoRepo, paginaRepo,
            vinculoRepo, matriculaRepo, progressoPaginaRepo, progressoRepo);

    private final Turma turmaA = Turma.builder().id(10L).nome("5º A").professorId(PROF).build();
    private final Turma turmaB = Turma.builder().id(11L).nome("5º B").professorId(PROF).build();
    private final Licao licao = Licao.builder().id(LICAO).titulo("Laços").conceito("Repetição")
            .modo(ModoAtividade.BLOCOS).status(StatusLicao.ATIVA).professorId(PROF).publicadaEm(T).build();

    // ---------- construtores ----------

    private static TurmaAluno matricula(Turma t, long alunoId, String nome) {
        return TurmaAluno.builder().id(alunoId * 100 + t.getId()).turma(t).alunoId(alunoId).alunoNome(nome)
                .ingressoEm(T).build();
    }

    private static PaginaLicao pagina(long id, Licao l, int ordem, TipoPagina tipo) {
        return PaginaLicao.builder().id(id).licao(l).ordem(ordem).tipo(tipo).titulo("Página " + ordem)
                .conteudoJson("{}").build();
    }

    private static ProgressoPagina vista(long aluno, PaginaLicao p) {
        return ProgressoPagina.builder().alunoId(aluno).pagina(p).vistaEm(T).build();
    }

    private static ProgressoPagina videoConferido(long aluno, PaginaLicao p) {
        return ProgressoPagina.builder().alunoId(aluno).pagina(p).segundosVideo(70).videoConferidoEm(T).build();
    }

    private static ProgressoPagina questionario(long aluno, PaginaLicao p, int melhor, int tentativas, boolean aprovado) {
        return ProgressoPagina.builder().alunoId(aluno).pagina(p).tentativas(tentativas).melhorPercentual(melhor)
                .aprovadoEm(aprovado ? T : null).build();
    }

    private static ProgressoLicao progressoLicao(long aluno, Licao l, LocalDateTime concluidaEm) {
        return ProgressoLicao.builder().alunoId(aluno).licao(l).atividadeConcluida(concluidaEm != null)
                .concluidaEm(concluidaEm).build();
    }

    private void cenario(List<Turma> turmas, List<PaginaLicao> paginas, List<TurmaAluno> matriculas,
                         List<ProgressoPagina> pps, List<ProgressoLicao> pls) {
        when(licaoRepo.findById(LICAO)).thenReturn(Optional.of(licao));
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(LICAO)).thenReturn(paginas);
        when(vinculoRepo.findComTurmaByLicaoIdIn(anyCollection())).thenReturn(turmas.stream()
                .map(t -> LicaoTurma.builder().licao(licao).turma(t).vinculadaEm(T).build()).toList());
        when(matriculaRepo.findByTurmaIdIn(anyCollection())).thenReturn(matriculas);
        when(progressoPaginaRepo.findByPaginaIdInAndAlunoIdIn(anyCollection(), anyCollection())).thenReturn(pps);
        when(progressoRepo.findByLicaoIdAndAlunoIdIn(eq(LICAO), anyCollection())).thenReturn(pls);
    }

    private static AlunoProgresso aluno(ProgressoLicaoProfessorResponse r, long turmaId, long alunoId) {
        return r.turmas().stream().filter(t -> t.turmaId() == turmaId).findFirst().orElseThrow()
                .alunos().stream().filter(a -> a.alunoId() == alunoId).findFirst().orElseThrow();
    }

    // ---------- estados e páginas ----------

    @Test
    void quatroEstadosEPaginaAPaginaPorTipo() {
        PaginaLicao texto = pagina(101L, licao, 0, TipoPagina.TEXTO);
        PaginaLicao imagem = pagina(102L, licao, 1, TipoPagina.IMAGEM_TEXTO);
        PaginaLicao video = pagina(103L, licao, 2, TipoPagina.VIDEO_YOUTUBE);
        PaginaLicao quiz = pagina(104L, licao, 3, TipoPagina.QUESTIONARIO);
        // Vídeo só aberto (vista) não conta: o vídeo exige conferência.
        ProgressoPagina videoSoAberto = vista(2L, video);
        cenario(List.of(turmaA), List.of(texto, imagem, video, quiz),
                List.of(matricula(turmaA, 1L, "Ana"), matricula(turmaA, 2L, "Bia"), matricula(turmaA, 3L, "Caio"),
                        matricula(turmaA, 4L, "Duda")),
                List.of(vista(2L, texto), videoSoAberto, questionario(2L, quiz, 50, 2, false),
                        vista(3L, texto), vista(3L, imagem), videoConferido(3L, video), questionario(3L, quiz, 100, 1, true),
                        vista(4L, texto), vista(4L, imagem), videoConferido(4L, video), questionario(4L, quiz, 80, 3, true)),
                List.of(progressoLicao(4L, licao, T)));

        ProgressoLicaoProfessorResponse r = service.progresso(PROF, LICAO);

        assertThat(r.turmas()).singleElement().extracting(TurmaProgresso::alunos)
                .satisfies(alunos -> assertThat(alunos).extracting(AlunoProgresso::estado).containsExactly(
                        EstadoLicaoAluno.NAO_INICIADA, EstadoLicaoAluno.EM_ANDAMENTO,
                        EstadoLicaoAluno.PRATICA_LIBERADA, EstadoLicaoAluno.CONCLUIDA));
        AlunoProgresso ana = aluno(r, 10L, 1L);
        assertThat(ana.paginas()).extracting(PaginaAluno::concluida).containsExactly(false, false, false, false);
        assertThat(ana.paginas().get(3).melhorPercentual()).isNull();
        assertThat(ana.paginas().get(3).tentativas()).isNull();
        assertThat(ana.melhorPercentualQuestionario()).isNull();

        AlunoProgresso bia = aluno(r, 10L, 2L);
        assertThat(bia.paginas()).extracting(PaginaAluno::concluida).containsExactly(true, false, false, false);
        assertThat(bia.paginas().get(3)).isEqualTo(new PaginaAluno(104L, false, 50, 2));
        assertThat(bia.paginas().get(0).melhorPercentual()).isNull();
        assertThat(bia.paginasConcluidas()).isEqualTo(1);

        AlunoProgresso duda = aluno(r, 10L, 4L);
        assertThat(duda.paginas()).extracting(PaginaAluno::paginaId).containsExactly(101L, 102L, 103L, 104L);
        assertThat(duda.paginas()).allMatch(PaginaAluno::concluida);
        assertThat(duda.atividadeConcluida()).isTrue();
        assertThat(duda.concluidaEm()).isEqualTo(T);

        assertThat(r.paginas()).extracting(p -> p.tipo()).containsExactly(TipoPagina.TEXTO,
                TipoPagina.IMAGEM_TEXTO, TipoPagina.VIDEO_YOUTUBE, TipoPagina.QUESTIONARIO);
        assertThat(r.licao().estado()).isEqualTo(EstadoLicao.PUBLICADA);
        assertThat(r.licao().titulo()).isEqualTo("Laços");
        assertThat(r.totalAlunos()).isEqualTo(4);
        assertThat(r.concluiram()).isEqualTo(1);
    }

    @Test
    void turmasPelaOrdemDaConsultaEAlunosPorNomeSemCaixaNemAcento() {
        cenario(List.of(turmaA, turmaB), List.of(pagina(101L, licao, 0, TipoPagina.TEXTO)),
                List.of(matricula(turmaA, 30L, "bruno"), matricula(turmaA, 20L, "Bruno"),
                        matricula(turmaA, 40L, "Álvaro"), matricula(turmaA, 10L, "carla"),
                        matricula(turmaA, 50L, null), matricula(turmaB, 60L, "Zeca")),
                List.of(), List.of());

        ProgressoLicaoProfessorResponse r = service.progresso(PROF, LICAO);

        assertThat(r.turmas()).extracting(TurmaProgresso::turmaNome).containsExactly("5º A", "5º B");
        assertThat(r.turmas().get(0).alunos()).extracting(AlunoProgresso::nome)
                .containsExactly("Aluno 50", "Álvaro", "Bruno", "bruno", "carla");
        assertThat(r.turmas().get(1).alunos()).extracting(AlunoProgresso::alunoId).containsExactly(60L);
    }

    @Test
    void alunoEmDuasTurmasApareceNasDuasMasContaUmaVez() {
        PaginaLicao t = pagina(101L, licao, 0, TipoPagina.TEXTO);
        cenario(List.of(turmaA, turmaB), List.of(t),
                List.of(matricula(turmaA, 1L, "Ana"), matricula(turmaB, 1L, "Ana"), matricula(turmaB, 2L, "Bia")),
                List.of(vista(1L, t)), List.of(progressoLicao(1L, licao, T)));

        ProgressoLicaoProfessorResponse r = service.progresso(PROF, LICAO);

        assertThat(aluno(r, 10L, 1L).estado()).isEqualTo(EstadoLicaoAluno.CONCLUIDA);
        assertThat(aluno(r, 11L, 1L).estado()).isEqualTo(EstadoLicaoAluno.CONCLUIDA);
        assertThat(r.totalAlunos()).isEqualTo(2);
        assertThat(r.concluiram()).isEqualTo(1);
    }

    @Test
    void mediaInteiraDosQuestionariosTentados() {
        PaginaLicao q1 = pagina(11L, licao, 0, TipoPagina.QUESTIONARIO);
        PaginaLicao q2 = pagina(12L, licao, 1, TipoPagina.QUESTIONARIO);
        PaginaLicao q3 = pagina(13L, licao, 2, TipoPagina.QUESTIONARIO);
        cenario(List.of(turmaA), List.of(q1, q2, q3), List.of(matricula(turmaA, 1L, "Ana")),
                List.of(questionario(1L, q1, 85, 1, true), questionario(1L, q2, 70, 4, true),
                        ProgressoPagina.builder().alunoId(1L).pagina(q3).build()),
                List.of());

        AlunoProgresso ana = aluno(service.progresso(PROF, LICAO), 10L, 1L);

        assertThat(ana.melhorPercentualQuestionario()).isEqualTo(77);
        assertThat(ana.paginas().get(2)).isEqualTo(new PaginaAluno(13L, false, null, null));
        assertThat(ana.paginas().get(1).tentativas()).isEqualTo(4);
    }

    // ---------- vazios e acesso ----------

    @Test
    void licaoSemTurmasNaoConsultaMatriculasNemProgresso() {
        cenario(List.of(), List.of(pagina(101L, licao, 0, TipoPagina.TEXTO)), List.of(), List.of(), List.of());

        ProgressoLicaoProfessorResponse r = service.progresso(PROF, LICAO);

        assertThat(r.turmas()).isEmpty();
        assertThat(r.totalAlunos()).isZero();
        assertThat(r.paginas()).hasSize(1);
        verifyNoInteractions(matriculaRepo, progressoPaginaRepo, progressoRepo);
    }

    @Test
    void turmaSemAlunosApareceVaziaSemConsultarProgresso() {
        cenario(List.of(turmaA), List.of(pagina(101L, licao, 0, TipoPagina.TEXTO)), List.of(), List.of(), List.of());

        ProgressoLicaoProfessorResponse r = service.progresso(PROF, LICAO);

        assertThat(r.turmas()).singleElement().satisfies(t -> assertThat(t.alunos()).isEmpty());
        verifyNoInteractions(progressoPaginaRepo, progressoRepo);
    }

    @Test
    void licaoSemPaginasNaoConsultaProgressoDePaginas() {
        cenario(List.of(turmaA), List.of(), List.of(matricula(turmaA, 1L, "Ana")), List.of(), List.of());

        AlunoProgresso ana = aluno(service.progresso(PROF, LICAO), 10L, 1L);

        assertThat(ana.paginas()).isEmpty();
        assertThat(ana.estado()).isEqualTo(EstadoLicaoAluno.PRATICA_LIBERADA);
        verifyNoInteractions(progressoPaginaRepo);
    }

    @Test
    void rascunhoTambemMostraORelatorio() {
        licao.setPublicadaEm(null);
        cenario(List.of(turmaA), List.of(), List.of(matricula(turmaA, 1L, "Ana")), List.of(), List.of());

        assertThat(service.progresso(PROF, LICAO).licao().estado()).isEqualTo(EstadoLicao.RASCUNHO);
    }

    @Test
    void licaoInexistenteResponde404EDeOutroProfessor403() {
        when(licaoRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.progresso(PROF, 99L)).isInstanceOf(ResourceNotFoundException.class);

        when(licaoRepo.findById(LICAO)).thenReturn(Optional.of(licao));
        assertThatThrownBy(() -> service.progresso(6L, LICAO)).isInstanceOf(AcessoNegadoException.class)
                .hasMessage("Esta lição não pertence ao seu perfil.");
        verifyNoInteractions(paginaRepo, vinculoRepo, matriculaRepo, progressoPaginaRepo, progressoRepo);
    }

    // ---------- consistência e consultas ----------

    @Test
    void mesmosDadosDaoOMesmoEstadoEPaginasNaVisaoDoAluno() {
        PaginaLicao a = pagina(11L, licao, 0, TipoPagina.TEXTO);
        PaginaLicao b = pagina(12L, licao, 1, TipoPagina.QUESTIONARIO);
        PaginaLicao c = pagina(13L, licao, 2, TipoPagina.VIDEO_YOUTUBE);
        long alunoId = 7L;
        List<PaginaLicao> paginas = List.of(a, b, c);
        List<ProgressoPagina> pps = List.of(vista(alunoId, a), questionario(alunoId, b, 40, 1, false),
                videoConferido(alunoId, c));
        List<ProgressoLicao> pls = List.of(ProgressoLicao.builder().alunoId(alunoId).licao(licao)
                .estadoJson("{}").build());
        cenario(List.of(turmaA), paginas, List.of(matricula(turmaA, alunoId, "Eva")), pps, pls);
        AlunoProgresso painel = aluno(service.progresso(PROF, LICAO), 10L, alunoId);

        LicaoTurmaRepository vinculosAluno = mock(LicaoTurmaRepository.class);
        PaginaLicaoRepository paginasAluno = mock(PaginaLicaoRepository.class);
        ProgressoLicaoRepository progressosAluno = mock(ProgressoLicaoRepository.class);
        ProgressoPaginaRepository progressosPaginaAluno = mock(ProgressoPaginaRepository.class);
        LicaoService alunoService = new LicaoService(mock(LicaoRepository.class), vinculosAluno, paginasAluno,
                progressosAluno, progressosPaginaAluno, new ConteudoPaginaLeitor(JsonMapper.builder().build()),
                mock(ValidadorPratica.class), new RelogioManual(Instant.parse("2026-11-17T12:00:00Z")));
        when(vinculosAluno.findVisiveisParaAluno(alunoId))
                .thenReturn(List.of(LicaoTurma.builder().licao(licao).turma(turmaA).vinculadaEm(T).build()));
        when(paginasAluno.findByLicaoIdIn(anyCollection())).thenReturn(paginas);
        when(progressosPaginaAluno.findByAlunoIdAndPaginaIdIn(anyLong(), anyCollection())).thenReturn(pps);
        when(progressosAluno.findByAlunoIdAndLicaoIdIn(anyLong(), anyCollection())).thenReturn(pls);
        LicaoResumoResponse visaoAluno = alunoService.listarParaAluno(alunoId).get(0);

        assertThat(painel.estado()).isEqualTo(visaoAluno.estado()).isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
        assertThat(painel.paginasConcluidas()).isEqualTo(visaoAluno.paginasConcluidas()).isEqualTo(2);
        assertThat(painel.atividadeConcluida()).isEqualTo(visaoAluno.atividadeConcluida());
        assertThat(painel.concluidaEm()).isEqualTo(visaoAluno.concluidaEm());
    }

    @Test
    void numeroFixoDeConsultasPara1AlunoE1TurmaOu40AlunosE3Turmas() {
        int[][] tamanhos = {{1, 1}, {40, 3}};
        List<Integer> chamadas = new ArrayList<>();
        for (int[] tamanho : tamanhos) {
            LicaoRepository licoes = mock(LicaoRepository.class);
            PaginaLicaoRepository paginas = mock(PaginaLicaoRepository.class);
            LicaoTurmaRepository vinculos = mock(LicaoTurmaRepository.class);
            TurmaAlunoRepository matriculas = mock(TurmaAlunoRepository.class);
            ProgressoPaginaRepository pps = mock(ProgressoPaginaRepository.class);
            ProgressoLicaoRepository pls = mock(ProgressoLicaoRepository.class);
            ProgressoLicaoProfessorService s = new ProgressoLicaoProfessorService(licoes, paginas, vinculos,
                    matriculas, pps, pls);

            List<PaginaLicao> ps = List.of(pagina(101L, licao, 0, TipoPagina.TEXTO),
                    pagina(102L, licao, 1, TipoPagina.QUESTIONARIO));
            List<LicaoTurma> vs = new ArrayList<>();
            List<TurmaAluno> ms = new ArrayList<>();
            List<ProgressoPagina> progressos = new ArrayList<>();
            for (long t = 1; t <= tamanho[1]; t++) {
                Turma turma = Turma.builder().id(t).nome("Turma " + t).professorId(PROF).build();
                vs.add(LicaoTurma.builder().licao(licao).turma(turma).vinculadaEm(T).build());
                for (long a = 1; a <= tamanho[0]; a++) {
                    long alunoId = t * 1000 + a;
                    ms.add(matricula(turma, alunoId, "Aluno " + alunoId));
                    for (PaginaLicao p : ps) progressos.add(vista(alunoId, p));
                }
            }
            when(licoes.findById(LICAO)).thenReturn(Optional.of(licao));
            when(paginas.findByLicaoIdOrderByOrdemAsc(LICAO)).thenReturn(ps);
            when(vinculos.findComTurmaByLicaoIdIn(anyCollection())).thenReturn(vs);
            when(matriculas.findByTurmaIdIn(anyCollection())).thenReturn(ms);
            when(pps.findByPaginaIdInAndAlunoIdIn(anyCollection(), anyCollection())).thenReturn(progressos);
            when(pls.findByLicaoIdAndAlunoIdIn(any(), anyCollection())).thenReturn(List.of());

            ProgressoLicaoProfessorResponse r = s.progresso(PROF, LICAO);
            assertThat(r.totalAlunos()).isEqualTo(tamanho[0] * tamanho[1]);

            int total = 0;
            for (Object repo : List.of(licoes, paginas, vinculos, matriculas, pps, pls)) {
                total += mockingDetails(repo).getInvocations().size();
            }
            chamadas.add(total);
        }
        assertThat(chamadas).containsExactly(6, 6);
    }
}
