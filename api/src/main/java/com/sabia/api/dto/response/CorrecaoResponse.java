package com.sabia.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CorrecaoResponse(
        Long id,
        BigDecimal nota,
        String feedbackProfessor,
        String relatorioIaJson,
        LocalDateTime avaliadaEm
) {}
