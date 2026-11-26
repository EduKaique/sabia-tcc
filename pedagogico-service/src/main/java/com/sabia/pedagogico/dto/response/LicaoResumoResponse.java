package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;

import java.time.LocalDateTime;
import java.util.List;

/** Item de GET /api/aluno/licoes. {@code turmas}: só as turmas do aluno às quais a lição está vinculada. */
public record LicaoResumoResponse(
        Long id,
        String titulo,
        String conceito,
        String resumo,
        ModoPratica modo,
        EstadoLicaoAluno estado,
        int totalPaginas,
        int paginasConcluidas,
        boolean atividadeConcluida,
        LocalDateTime concluidaEm,
        List<TurmaVinculadaResponse> turmas
) {}
