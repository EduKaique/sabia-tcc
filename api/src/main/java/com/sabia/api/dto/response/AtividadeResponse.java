package com.sabia.api.dto.response;

import com.sabia.api.domain.activity.StatusAtividade;

import java.time.LocalDateTime;
import java.util.UUID;

public record AtividadeResponse(
        UUID id,
        String titulo,
        String descricao,
        UUID turmaId,
        int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        boolean eGeradaIa,
        StatusAtividade status,
        LocalDateTime criadaEm
) {}
