package com.sabia.pedagogico.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Conteúdo da página na visão do aluno. Cada record é montado campo a campo a partir do conteúdo gravado; o
 * questionário não tem o campo da alternativa certa.
 */
public sealed interface ConteudoPaginaAluno {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record Texto(String html) implements ConteudoPaginaAluno {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record ImagemTexto(String imagemUrl, String alt, String legenda, String html) implements ConteudoPaginaAluno {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record VideoYoutube(String videoId, String titulo, String canal, Integer duracaoSegundos)
            implements ConteudoPaginaAluno {}

    record Questionario(int percentualMinimo, List<Pergunta> perguntas) implements ConteudoPaginaAluno {}

    record Pergunta(String enunciado, List<String> alternativas) {}
}
