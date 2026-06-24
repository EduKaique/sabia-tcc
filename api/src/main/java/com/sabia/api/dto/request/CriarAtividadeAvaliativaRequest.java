package com.sabia.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

import com.sabia.api.model.atividade.StatusAtividade;

public record CriarAtividadeAvaliativaRequest(
        @NotBlank String titulo,
        String descricao,
        StatusAtividade status,
        @NotNull Long turmaId,
        @Min(1) int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        String gabaritoEstadoJson
) {}
