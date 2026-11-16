package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

public record EditarAtividadeRequest(
        String titulo,
        String descricao,
        @Min(value = 1, message = "A pontuação máxima deve ficar entre 1 e 100.")
        @Max(value = 100, message = "A pontuação máxima deve ficar entre 1 e 100.") Integer pontuacaoMaxima,
        LocalDateTime dataEntrega,
        String gabaritoEstadoJson,
        ModoAtividade modo,
        String cenarioJson
) {}
