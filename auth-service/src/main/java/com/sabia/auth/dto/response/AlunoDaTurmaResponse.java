package com.sabia.auth.dto.response;

import java.time.LocalDateTime;

/** Linha da tabela de alunos da turma (professor). Sem CPF, e-mail, data de nascimento nem hash. */
public record AlunoDaTurmaResponse(
        Long alunoId,
        String nome,
        String matricula,
        String avatar,
        LocalDateTime ingressoEm,
        boolean trocaSenhaPendente
) {}
