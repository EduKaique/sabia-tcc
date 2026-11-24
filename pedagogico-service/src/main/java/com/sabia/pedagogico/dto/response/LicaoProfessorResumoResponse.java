package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicao;

import java.time.LocalDateTime;
import java.util.List;

public record LicaoProfessorResumoResponse(
        Long id,
        EstadoLicao estado,
        String titulo,
        String conceito,
        String resumo,
        ModoAtividade modo,
        List<TurmaVinculadaResponse> turmas,
        long quantidadePaginas,
        LocalDateTime atualizadaEm
) {}
