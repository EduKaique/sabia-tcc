package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.StatusAtividade;

public record AtividadeAvaliativaProfessorResponse(
        Long id,
        String titulo,
        String descricao,
        Long turmaId,
        int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        boolean eGeradaIa,
        StatusAtividade status,
        LocalDateTime criadaEm,
        String gabaritoEstadoJson
) {}
