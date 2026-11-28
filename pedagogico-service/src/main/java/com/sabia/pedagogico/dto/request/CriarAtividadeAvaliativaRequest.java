package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.atividade.StatusAtividade;

public record CriarAtividadeAvaliativaRequest(
        @NotBlank String titulo,
        String descricao,
        StatusAtividade status,
        @NotNull Long turmaId,
        @Min(value = 1, message = "A pontuação máxima deve ficar entre 1 e 100.")
        @Max(value = 100, message = "A pontuação máxima deve ficar entre 1 e 100.") int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        String gabaritoEstadoJson,
        ModoPratica modo,
        String cenarioJson
) {}
