package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoPublicacaoLicao;

import java.time.LocalDateTime;
import java.util.List;

public record LicaoProfessorResumoResponse(
        Long id,
        EstadoPublicacaoLicao estado,
        String titulo,
        String conceito,
        String resumo,
        ModoPratica modo,
        List<TurmaVinculadaResponse> turmas,
        long quantidadePaginas,
        LocalDateTime atualizadaEm
) {}
