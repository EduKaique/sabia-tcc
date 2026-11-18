package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.EditarAtividadeRequest;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.mapper.AtividadeAvaliativaMapperImpl;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AtividadeAvaliativaServicePontuacaoTest {

    private final AtividadeAvaliativaRepository atividadeRepo = mock(AtividadeAvaliativaRepository.class);
    private final SubmissaoAvaliativaRepository submissaoRepo = mock(SubmissaoAvaliativaRepository.class);
    private final AtividadeAvaliativaService service = new AtividadeAvaliativaService(
            atividadeRepo, mock(TurmaRepository.class), mock(TurmaAlunoRepository.class),
            new AtividadeAvaliativaMapperImpl(), submissaoRepo, mock(CenarioRoboValidador.class));
    private final Turma turma = new Turma();
    private final AtividadeAvaliativa atividade = atividade(10L);

    AtividadeAvaliativaServicePontuacaoTest() {
        turma.setId(3L);
        turma.setProfessorId(5L);
        when(atividadeRepo.findById(10L)).thenReturn(Optional.of(atividade));
        when(atividadeRepo.save(any(AtividadeAvaliativa.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private AtividadeAvaliativa atividade(Long id) {
        var a = new AtividadeAvaliativa();
        a.setId(id);
        a.setTurma(turma);
        a.setTitulo("Atividade " + id);
        a.setPontuacaoMaxima(10);
        return a;
    }

    private static EditarAtividadeRequest maximo(Integer pontuacaoMaxima) {
        return new EditarAtividadeRequest(null, null, pontuacaoMaxima, null, null, null, null);
    }

    @Test
    void mudarMaximoComCorrecaoDaConflito() {
        when(submissaoRepo.existeCorrecaoNaAtividade(10L)).thenReturn(true);

        assertThatThrownBy(() -> service.editar(5L, 10L, maximo(20)))
                .isInstanceOf(ConflitoException.class)
                .hasMessage("Não é possível alterar a pontuação máxima: a atividade já tem notas publicadas.");
        assertThat(atividade.getPontuacaoMaxima()).isEqualTo(10);
        verify(atividadeRepo, never()).save(any());
    }

    @Test
    void mudarMaximoComSubmissaoSemCorrecaoEhPermitido() {
        when(submissaoRepo.existsByAtividadeId(10L)).thenReturn(true);
        when(submissaoRepo.existeCorrecaoNaAtividade(10L)).thenReturn(false);

        var resposta = service.editar(5L, 10L, maximo(20));

        assertThat(resposta.pontuacaoMaxima()).isEqualTo(20);
        assertThat(resposta.possuiNotas()).isFalse();
    }

    @Test
    void reenviarOMesmoMaximoComCorrecaoEhPermitido() {
        when(submissaoRepo.existeCorrecaoNaAtividade(10L)).thenReturn(true);

        var resposta = service.editar(5L, 10L, new EditarAtividadeRequest("Novo título", null, 10, null, null, null, null));

        assertThat(resposta.titulo()).isEqualTo("Novo título");
        assertThat(resposta.pontuacaoMaxima()).isEqualTo(10);
        assertThat(resposta.possuiNotas()).isTrue();
    }

    @Test
    void buscarInformaSeAtividadePossuiNotas() {
        when(submissaoRepo.existeCorrecaoNaAtividade(10L)).thenReturn(true);
        assertThat(service.buscarParaProfessor(5L, 10L).possuiNotas()).isTrue();

        when(submissaoRepo.existeCorrecaoNaAtividade(10L)).thenReturn(false);
        assertThat(service.buscarParaProfessor(5L, 10L).possuiNotas()).isFalse();
    }

    @Test
    void listagemCalculaPossuiNotasComUmaConsulta() {
        var outra = atividade(11L);
        when(atividadeRepo.findByTurma_ProfessorId(5L)).thenReturn(List.of(atividade, outra));
        when(submissaoRepo.findAtividadeIdsComCorrecao(List.of(10L, 11L))).thenReturn(List.of(11L));

        var lista = service.listarDosProfessor(5L, null, null);

        assertThat(lista).extracting("id", "possuiNotas")
                .containsExactly(org.assertj.core.groups.Tuple.tuple(10L, false), org.assertj.core.groups.Tuple.tuple(11L, true));
        assertThat(lista.get(0).turmaId()).isEqualTo(3L);
        verify(submissaoRepo, never()).existeCorrecaoNaAtividade(anyLong());
    }
}
