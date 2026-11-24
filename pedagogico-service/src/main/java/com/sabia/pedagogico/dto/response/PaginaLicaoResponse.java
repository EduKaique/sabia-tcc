package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.licao.TipoPagina;
import tools.jackson.databind.JsonNode;

/** Página para o PROFESSOR: {@code conteudo} é o objeto gravado, com o gabarito do questionário. */
public record PaginaLicaoResponse(Long id, int ordem, TipoPagina tipo, String titulo, JsonNode conteudo) {}
