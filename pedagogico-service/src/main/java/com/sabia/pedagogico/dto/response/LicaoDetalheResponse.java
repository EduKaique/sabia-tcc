package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

public record LicaoDetalheResponse(
        Long id,
        String codigo,
        int ordem,
        String titulo,
        String resumo,
        String conteudo,
        String conceito,
        String habilidadeBncc,
        String videoId,
        String videoTitulo,
        String videoCanal,
        ModoAtividade modo,
        String cenarioJson,
        ProgressoLicaoResponse progresso,
        String estadoJson
) {}
