package com.sabia.api.dto.request;

import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

public record EditarAtividadeRequest(
        String titulo,
        String descricao,
        @Min(1) Integer pontuacaoMaxima,
        LocalDateTime dataEntrega,
        String gabaritoEstadoJson
) {}
