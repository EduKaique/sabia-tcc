package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.service.pratica.ResultadoValidacao;

import java.time.LocalDateTime;

/** Progresso da lição (mesmos campos de ProgressoLicaoResponse) mais o veredito do servidor. */
public record ConclusaoAtividadeResponse(
        boolean videoVisto,
        boolean atividadeConcluida,
        boolean concluida,
        LocalDateTime concluidaEm,
        ResultadoValidacao validacao
) {}
