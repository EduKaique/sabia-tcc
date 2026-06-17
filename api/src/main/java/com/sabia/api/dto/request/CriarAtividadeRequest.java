package com.sabia.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CriarAtividadeRequest(
        @NotBlank String titulo,
        String descricao,
        @NotNull UUID turmaId,
        @Min(1) int pontuacaoMaxima,
        LocalDateTime dataEntrega
) {}
