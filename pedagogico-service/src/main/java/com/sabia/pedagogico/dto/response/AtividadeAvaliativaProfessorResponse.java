package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.atividade.StatusAtividade;

public record AtividadeAvaliativaProfessorResponse(
        Long id,
        String titulo,
        String descricao,
        Long turmaId,
        int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        StatusAtividade status,
        LocalDateTime criadaEm,
        String gabaritoEstadoJson,
        ModoPratica modo,
        String cenarioJson,
        boolean possuiNotas
) {}
