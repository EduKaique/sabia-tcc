package com.sabia.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AvaliacaoResponse(
        UUID id,
        BigDecimal nota,
        String feedbackProfessor,
        String relatorioIaJson,
        LocalDateTime avaliadaEm
) {}
