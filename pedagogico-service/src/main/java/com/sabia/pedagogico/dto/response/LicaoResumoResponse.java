package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

public record LicaoResumoResponse(
        Long id,
        String codigo,
        int ordem,
        String titulo,
        String resumo,
        String conceito,
        String habilidadeBncc,
        ModoAtividade modo,
        String videoId,
        ProgressoLicaoResponse progresso
) {}
