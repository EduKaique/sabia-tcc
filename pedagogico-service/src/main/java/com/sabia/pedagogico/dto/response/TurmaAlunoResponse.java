package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.turma.TurmaAluno;

import java.time.LocalDateTime;

public record TurmaAlunoResponse(
        Long alunoId,
        String alunoNome,
        LocalDateTime ingressoEm
) {
    public static TurmaAlunoResponse from(TurmaAluno ta) {
        return new TurmaAlunoResponse(ta.getAlunoId(), ta.getAlunoNome(), ta.getIngressoEm());
    }
}
