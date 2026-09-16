package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;

public record SubmissaoAvaliativaResponse(
        Long id,
        Long atividadeId,
        LocalDateTime dataEnvio,
        StatusSubmissao status,
        CorrecaoResponse correcao
) {}
