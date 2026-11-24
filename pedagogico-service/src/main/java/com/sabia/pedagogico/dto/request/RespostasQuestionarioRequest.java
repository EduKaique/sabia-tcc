package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Índice da alternativa escolhida em cada pergunta, na ordem das perguntas. */
public record RespostasQuestionarioRequest(
        @NotNull(message = "Envie as respostas do questionário.")
        @Size(max = 10, message = "O questionário tem no máximo 10 perguntas.")
        List<@NotNull(message = "Responda todas as perguntas.") Integer> respostas
) {}
