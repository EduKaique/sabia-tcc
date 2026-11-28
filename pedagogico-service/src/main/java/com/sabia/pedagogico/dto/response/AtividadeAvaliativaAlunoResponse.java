package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.atividade.StatusAtividadeAluno;

public record AtividadeAvaliativaAlunoResponse(
        Long id,
        String titulo,
        String descricao,
        Long turmaId,
        int pontuacaoMaxima,
        LocalDateTime dataEntrega,
        StatusAtividadeAluno status,
        LocalDateTime criadaEm,
        ModoPratica modo,
        String cenarioJson,
        /** Nota, comentário e data da correção: só preenchidos quando a atividade está CORRIGIDA. */
        BigDecimal nota,
        String feedbackProfessor,
        LocalDateTime corrigidaEm
) {}
