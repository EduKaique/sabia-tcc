package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

public record EditarAtividadeRequest(
        String titulo,
        String descricao,
        @Min(1) Integer pontuacaoMaxima,
        LocalDateTime dataEntrega,
        String gabaritoEstadoJson,
        ModoAtividade modo,
        String cenarioJson
) {}
