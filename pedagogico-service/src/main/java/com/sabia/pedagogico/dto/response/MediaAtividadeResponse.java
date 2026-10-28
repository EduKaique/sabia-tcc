package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;

public record MediaAtividadeResponse(
        Long atividadeId,
        String atividadeTitulo,
        int pontuacaoMaxima,
        BigDecimal media,
        BigDecimal mediaPercentual,
        long totalEntregas,
        long totalCorrigidas,
        long totalAlunos,
        BigDecimal taxaEntrega
) {}
