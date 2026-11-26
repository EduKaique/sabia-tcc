package com.sabia.pedagogico.service;

import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.mapper.AtividadeAvaliativaMapperImpl;
import com.sabia.pedagogico.model.atividade.ProjetoAvaliativo;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.Correcao;
import com.sabia.pedagogico.model.atividade.StatusAtividade;
import com.sabia.pedagogico.model.atividade.StatusAtividadeAluno;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AtividadeAvaliativaServiceAlunoTest {

    private static final Long ALUNO = 7L;
    private static final LocalDateTime AVALIADA_EM = LocalDateTime.of(2026, 11, 10, 14, 30);

    private final AtividadeAvaliativaRepository atividadeRepo = mock(AtividadeAvaliativaRepository.class);
    private final TurmaAlunoRepository turmaAlunoRepo = mock(TurmaAlunoRepository.class);
    private final SubmissaoAvaliativaRepository submissaoRepo = mock(SubmissaoAvaliativaRepository.class);
    private final AtividadeAvaliativaService service = new AtividadeAvaliativaService(
            atividadeRepo, mock(TurmaRepository.class), turmaAlunoRepo,
            new AtividadeAvaliativaMapperImpl(), submissaoRepo, mock(CenarioRoboValidador.class));
    private final Turma turma = new Turma();

    AtividadeAvaliativaServiceAlunoTest() {
        turma.setId(3L);
        var matricula = new TurmaAluno();
        matricula.setTurma(turma);
        matricula.setAlunoId(ALUNO);
        when(turmaAlunoRepo.findByAlunoId(ALUNO)).thenReturn(List.of(matricula));
        when(turmaAlunoRepo.existsByTurmaIdAndAlunoId(3L, ALUNO)).thenReturn(true);
    }

    private AtividadeAvaliativa atividade(Long id) {
        var a = new AtividadeAvaliativa();
        a.setId(id);
        a.setTurma(turma);
        a.setTitulo("Atividade " + id);
        a.setPontuacaoMaxima(10);
        a.setStatus(StatusAtividade.PUBLICADA);
        when(atividadeRepo.findById(id)).thenReturn(Optional.of(a));
        return a;
    }

    private SubmissaoAvaliativa submissao(AtividadeAvaliativa atividade, StatusSubmissao status) {
        var s = new SubmissaoAvaliativa();
        s.setAlunoId(ALUNO);
        s.setAtividade(atividade);
        s.setStatus(status);
        when(submissaoRepo.findByAlunoIdAndAtividadeId(ALUNO, atividade.getId())).thenReturn(Optional.of(s));
        return s;
    }

    private static Correcao correcao(SubmissaoAvaliativa s) {
        var c = Correcao.builder().submissao(s).nota(new BigDecimal("8.50"))
                .feedbackProfessor("Muito bem!\nRevise o laço.").corrigidaEm(AVALIADA_EM).build();
        s.setCorrecao(c);
        return c;
    }

    @Test
    void corrigidaTrazNotaFeedbackEData() {
        var a = atividade(1L);
        correcao(submissao(a, StatusSubmissao.CORRIGIDA));

        var r = service.buscarParaAluno(ALUNO, 1L);

        assertThat(r.status()).isEqualTo(StatusAtividadeAluno.CORRIGIDA);
        assertThat(r.nota()).isEqualByComparingTo("8.5");
        assertThat(r.feedbackProfessor()).isEqualTo("Muito bem!\nRevise o laço.");
        assertThat(r.corrigidaEm()).isEqualTo(AVALIADA_EM);
        assertThat(r.pontuacaoMaxima()).isEqualTo(10);
    }

    @Test
    void entregueEPendenteTrazemNulos() {
        var entregue = atividade(1L);
        submissao(entregue, StatusSubmissao.PENDENTE);
        atividade(2L);

        var r1 = service.buscarParaAluno(ALUNO, 1L);
        var r2 = service.buscarParaAluno(ALUNO, 2L);

        assertThat(r1.status()).isEqualTo(StatusAtividadeAluno.ENTREGUE);
        assertThat(r2.status()).isEqualTo(StatusAtividadeAluno.PENDENTE);
        for (var r : List.of(r1, r2)) {
            assertThat(r.nota()).isNull();
            assertThat(r.feedbackProfessor()).isNull();
            assertThat(r.corrigidaEm()).isNull();
        }
    }

    @Test
    void listagemMisturaEstadosComUmaConsultaDeSubmissoes() {
        var pendente = atividade(1L);
        var entregue = atividade(2L);
        var corrigida = atividade(3L);
        var sEntregue = submissao(entregue, StatusSubmissao.PENDENTE);
        var sCorrigida = submissao(corrigida, StatusSubmissao.CORRIGIDA);
        correcao(sCorrigida);
        when(atividadeRepo.findByTurmaIdInAndStatus(List.of(3L), StatusAtividade.PUBLICADA))
                .thenReturn(List.of(pendente, entregue, corrigida));
        when(submissaoRepo.findByAlunoIdComCorrecao(ALUNO)).thenReturn(List.of(sEntregue, sCorrigida));

        var lista = service.listarPublicadasParaAluno(ALUNO);

        assertThat(lista).extracting("id", "status").containsExactly(
                org.assertj.core.groups.Tuple.tuple(1L, StatusAtividadeAluno.PENDENTE),
                org.assertj.core.groups.Tuple.tuple(2L, StatusAtividadeAluno.ENTREGUE),
                org.assertj.core.groups.Tuple.tuple(3L, StatusAtividadeAluno.CORRIGIDA));
        assertThat(lista.get(0).nota()).isNull();
        assertThat(lista.get(1).nota()).isNull();
        assertThat(lista.get(2).nota()).isEqualByComparingTo("8.5");
        assertThat(lista.get(2).feedbackProfessor()).startsWith("Muito bem!");
    }

    @Test
    void alunoComEntregaRecebeOProprioProjeto() {
        var a = atividade(1L);
        var s = submissao(a, StatusSubmissao.PENDENTE);
        var projeto = new ProjetoAvaliativo();
        projeto.setEstadoJson("{\"blocks\":{}}");
        s.setProjeto(projeto);
        s.setEnviadaEm(AVALIADA_EM);

        var r = service.buscarProjetoDoAluno(ALUNO, 1L);

        assertThat(r.estadoJson()).isEqualTo("{\"blocks\":{}}");
        assertThat(r.enviadaEm()).isEqualTo(AVALIADA_EM);
    }

    @Test
    void alunoSemEntregaRecebe404() {
        atividade(1L);
        when(submissaoRepo.findByAlunoIdAndAtividadeId(ALUNO, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarProjetoDoAluno(ALUNO, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Você ainda não entregou esta atividade.");
    }

    @Test
    void alunoForaDaTurmaERecusadoComoNoBuscar() {
        atividade(1L);
        when(turmaAlunoRepo.existsByTurmaIdAndAlunoId(3L, 99L)).thenReturn(false);

        assertThatThrownBy(() -> service.buscarProjetoDoAluno(99L, 1L))
                .isInstanceOf(AcessoNegadoException.class)
                .hasMessage("Você não está matriculado nesta turma.");
        assertThatThrownBy(() -> service.buscarParaAluno(99L, 1L))
                .isInstanceOf(AcessoNegadoException.class);
    }
}
