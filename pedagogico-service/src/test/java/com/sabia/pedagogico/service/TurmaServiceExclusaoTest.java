package com.sabia.pedagogico.service;

import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Excluir turma: os vínculos com lições saem antes (sem violar a FK); alunos ou atividades ainda bloqueiam. */
class TurmaServiceExclusaoTest {

    private final TurmaRepository turmaRepo = mock(TurmaRepository.class);
    private final TurmaAlunoRepository turmaAlunoRepo = mock(TurmaAlunoRepository.class);
    private final AtividadeAvaliativaRepository atividadeRepo = mock(AtividadeAvaliativaRepository.class);
    private final LicaoTurmaRepository vinculoRepo = mock(LicaoTurmaRepository.class);
    private final TurmaService service = new TurmaService(turmaRepo, turmaAlunoRepo, atividadeRepo, vinculoRepo);
    private final Turma turma = Turma.builder().id(10L).nome("6º A").professorId(5L).build();

    TurmaServiceExclusaoTest() {
        when(turmaRepo.findByIdAndProfessorId(10L, 5L)).thenReturn(Optional.of(turma));
    }

    @Test
    void turmaVaziaComLicoesVinculadasApagaOsVinculosAntesDaTurma() {
        when(vinculoRepo.deleteByTurmaId(10L)).thenReturn(2);

        service.excluir(5L, 10L);

        InOrder ordem = inOrder(vinculoRepo, turmaRepo);
        ordem.verify(vinculoRepo).deleteByTurmaId(10L);
        ordem.verify(turmaRepo).delete(turma);
    }

    @Test
    void turmaComAlunosOuAtividadesContinuaBloqueadaSemTocarNosVinculos() {
        when(turmaAlunoRepo.countByTurmaId(10L)).thenReturn(1L);
        assertThatThrownBy(() -> service.excluir(5L, 10L)).isInstanceOf(ConflitoException.class);

        when(turmaAlunoRepo.countByTurmaId(10L)).thenReturn(0L);
        when(atividadeRepo.countByTurmaId(10L)).thenReturn(3L);
        assertThatThrownBy(() -> service.excluir(5L, 10L)).isInstanceOf(ConflitoException.class);

        verify(vinculoRepo, never()).deleteByTurmaId(anyLong());
        verify(turmaRepo, never()).delete(any());
    }
}
