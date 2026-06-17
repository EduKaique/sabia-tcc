package com.sabia.api.dto.response;

import java.time.LocalDateTime;

import com.sabia.api.model.atividade.StatusSubmissao;

public record SubmissaoResponse(
        Long id,
        Long atividadeId,
        LocalDateTime dataEnvio,
        StatusSubmissao status,
        AvaliacaoResponse avaliacao
) {}
