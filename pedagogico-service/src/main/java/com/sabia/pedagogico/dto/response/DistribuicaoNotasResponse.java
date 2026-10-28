package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;
import java.util.List;

/** Notas normalizadas em percentual da pontuação máxima de cada atividade (0–100). */
public record DistribuicaoNotasResponse(
        List<FaixaNotaResponse> faixas,
        long totalNotas,
        BigDecimal mediaPercentual,
        BigDecimal medianaPercentual
) {}
