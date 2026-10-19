package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.turma.Turma;

/** Turma vista pelo aluno: só o necessário para a navegação. */
public record TurmaDoAlunoResponse(Long id, String nome) {

    public static TurmaDoAlunoResponse from(Turma turma) {
        return new TurmaDoAlunoResponse(turma.getId(), turma.getNome());
    }
}
