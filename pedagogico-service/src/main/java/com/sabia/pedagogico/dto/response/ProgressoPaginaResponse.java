package com.sabia.pedagogico.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/** Progresso do aluno numa página; {@code video} só em VIDEO_YOUTUBE e {@code questionario} só em QUESTIONARIO. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProgressoPaginaResponse(
        boolean concluida,
        LocalDateTime vistaEm,
        Video video,
        Questionario questionario
) {
    public record Video(int segundosCreditados, int segundosNecessarios, boolean conferido) {}

    public record Questionario(int tentativas, Integer melhorPercentual, boolean aprovado) {}
}
