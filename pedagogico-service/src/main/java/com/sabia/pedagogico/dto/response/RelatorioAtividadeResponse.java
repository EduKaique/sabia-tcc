package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;

public record RelatorioAtividadeResponse(
        Long atividadeId,
        String atividadeTitulo,
        String turmaNome,
        long totalAlunos,
        long totalEntregas,
        BigDecimal taxaEntrega,
        BigDecimal media
) {
}
