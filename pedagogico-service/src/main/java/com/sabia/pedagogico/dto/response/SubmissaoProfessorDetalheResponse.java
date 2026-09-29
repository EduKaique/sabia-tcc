package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;

public record SubmissaoProfessorDetalheResponse(
        Long id,
        Long atividadeId,
        String alunoNome,
        LocalDateTime dataEnvio,
        StatusSubmissao status,
        String estadoJson,
        CorrecaoResponse correcao
) {}
