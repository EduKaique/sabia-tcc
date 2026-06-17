package com.sabia.api.dto.response;

import com.sabia.api.domain.activity.StatusSubmissao;

import java.time.LocalDateTime;
import java.util.UUID;

public record SubmissaoResponse(
        UUID id,
        UUID atividadeId,
        LocalDateTime dataEnvio,
        StatusSubmissao status,
        AvaliacaoResponse avaliacao
) {}
