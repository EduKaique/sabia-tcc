package com.sabia.pedagogico.service;

import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class AlunoNomeServiceTest {

    private final TurmaAlunoRepository turmaAlunos = mock(TurmaAlunoRepository.class);
    private final SubmissaoAvaliativaRepository submissoes = mock(SubmissaoAvaliativaRepository.class);
    private final AlunoNomeService service = new AlunoNomeService(turmaAlunos, submissoes);

    @Test
    void atualizaOsNomesCopiadosEmMatriculasESubmissoes() {
        service.atualizarNome(7L, "Ana Souza");

        verify(turmaAlunos).atualizarNomeAluno(7L, "Ana Souza");
        verify(submissoes).atualizarNomeAluno(7L, "Ana Souza");
    }

    @Test
    void repetirOMesmoNomeRefazOMesmoUpdate() {
        service.atualizarNome(7L, "Ana Souza");
        service.atualizarNome(7L, "Ana Souza");

        verify(turmaAlunos, times(2)).atualizarNomeAluno(7L, "Ana Souza");
        verify(submissoes, times(2)).atualizarNomeAluno(7L, "Ana Souza");
    }
}
