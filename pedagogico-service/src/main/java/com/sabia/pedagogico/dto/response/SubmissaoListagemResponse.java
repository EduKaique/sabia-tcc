package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SubmissaoListagemResponse(
        Long id,
        Long alunoId,
        String alunoNome,
        String alunoFotoUrl,
        String nomeArquivo,
        boolean entregueComAtraso,
        StatusSubmissao status,
        BigDecimal nota,
        LocalDateTime dataEnvio
) {}
