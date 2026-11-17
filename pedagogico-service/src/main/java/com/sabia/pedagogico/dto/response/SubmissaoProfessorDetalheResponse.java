package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;

public record SubmissaoProfessorDetalheResponse(
        Long id,
        Long atividadeId,
        String alunoNome,
        LocalDateTime dataEnvio,
        StatusSubmissao status,
        String estadoJson,
        CorrecaoResponse correcao,
        String relatorioIaPreGeradoJson,
        /** Resultado validado no servidor na entrega; nulo para entregas antigas ou registro ilegível. */
        ResultadoValidacao validacao
) {}
