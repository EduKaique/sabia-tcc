package com.sabia.api.dto.response;

import java.time.LocalDateTime;

import com.sabia.api.model.atividade.StatusAtividadeAluno;

public record AtividadeAvaliativaAlunoResponse(
        Long id,
        String titulo,
        String descricao,
        Long turmaId,
        int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        boolean eGeradaIa,
        StatusAtividadeAluno status,
        LocalDateTime criadaEm
) {}
