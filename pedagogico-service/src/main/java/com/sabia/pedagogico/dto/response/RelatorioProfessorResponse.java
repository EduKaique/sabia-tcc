package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioProfessorResponse(
        long totalTurmas,
        long totalAlunos,
        long totalAtividades,
        long totalEntregas,
        BigDecimal taxaEntrega,
        BigDecimal taxaCorrecao,
        BigDecimal mediaGeral,
        List<RelatorioTurmaResponse> turmas,
        List<RelatorioAtividadeResponse> atividades
) {
}
