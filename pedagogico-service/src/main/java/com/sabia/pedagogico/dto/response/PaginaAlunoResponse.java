package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.licao.TipoPagina;

/** Página para o ALUNO: {@code conteudo} é a visão do aluno (questionário sem gabarito), nunca o JSON gravado. */
public record PaginaAlunoResponse(
        Long id,
        int ordem,
        TipoPagina tipo,
        String titulo,
        ConteudoPaginaAluno conteudo,
        ProgressoPaginaResponse progresso
) {}
