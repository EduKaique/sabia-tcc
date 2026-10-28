package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Séries alinhadas por índice: {@code alunos[i].notasPercentuais[j]} e {@code mediaTurma[j]}
 * correspondem a {@code atividades[j]}; {@code null} = sem nota corrigida.
 */
public record ProgressaoTurmaResponse(
        List<AtividadeRef> atividades,
        List<ProgressaoAluno> alunos,
        List<BigDecimal> mediaTurma
) {
    public record AtividadeRef(Long atividadeId, String titulo) {}

    public record ProgressaoAluno(
            Long alunoId,
            String alunoNome,
            BigDecimal mediaPercentual,
            List<BigDecimal> notasPercentuais
    ) {}
}
