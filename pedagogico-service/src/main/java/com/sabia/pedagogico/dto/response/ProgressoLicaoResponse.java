package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

public record ProgressoLicaoResponse(
        boolean videoVisto,
        boolean atividadeConcluida,
        boolean concluida,
        LocalDateTime concluidaEm
) {}
