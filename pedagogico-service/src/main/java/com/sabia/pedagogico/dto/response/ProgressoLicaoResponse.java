package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

/** Resposta do autosave (PUT /estado). {@code concluida} = concluidaEm preenchido. */
public record ProgressoLicaoResponse(
        boolean atividadeConcluida,
        boolean concluida,
        LocalDateTime concluidaEm
) {}
