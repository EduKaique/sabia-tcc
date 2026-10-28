package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;

public record RelatorioTurmaResponse(
        Long turmaId,
        String turmaNome,
        long totalAlunos,
        long totalAtividades,
        long totalEntregas,
        BigDecimal taxaEntrega,
        BigDecimal mediaTurma
) {
}
