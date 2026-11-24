package com.sabia.pedagogico.dto.request;

import com.sabia.pedagogico.model.licao.TipoPagina;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

/**
 * Página no salvamento da lição. Exceção à convenção dos campos *Json como string: {@code conteudo} é um
 * OBJETO JSON (formato por tipo, validado no servidor por ValidadorConteudoPagina) e é gravado como texto.
 * {@code id} nulo cria a página; com id, atualiza a página existente desta lição.
 */
public record PaginaLicaoRequest(
        Long id,
        @NotNull(message = "O tipo da página é obrigatório.")
        TipoPagina tipo,
        @Size(max = 150, message = "O título da página deve ter no máximo 150 caracteres.")
        String titulo,
        JsonNode conteudo
) {
    public PaginaLicaoRequest {
        titulo = titulo == null || titulo.isBlank() ? null : titulo.trim();
    }
}
