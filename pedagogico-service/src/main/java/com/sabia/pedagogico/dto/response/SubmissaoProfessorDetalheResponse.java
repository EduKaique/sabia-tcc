package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;
import com.sabia.pedagogico.service.robo.AnaliseRobo;

public record SubmissaoProfessorDetalheResponse(
        Long id,
        Long atividadeId,
        String alunoNome,
        LocalDateTime enviadaEm,
        StatusSubmissao status,
        String estadoJson,
        CorrecaoResponse correcao,
        String relatorioIaPreGeradoJson,
        /** Resultado validado no servidor na entrega; nulo para entregas antigas ou registro ilegível. */
        ResultadoValidacao validacao,
        /** Métricas e pseudocódigo do programa (Jogo do Robô), calculados sob demanda; nulo nos demais casos. */
        AnaliseRobo analiseRobo
) {}
