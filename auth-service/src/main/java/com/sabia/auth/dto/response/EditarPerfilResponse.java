package com.sabia.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resultado da edição do perfil, com um token novo que já traz o nome atualizado (mesmo padrão
 * da troca de senha). {@code aviso} aparece quando o nome não pôde ser propagado ao pedagógico.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EditarPerfilResponse(
        String nome,
        String avatar,
        String token,
        String aviso
) {
    public EditarPerfilResponse comAviso(String aviso) {
        return new EditarPerfilResponse(nome, avatar, token, aviso);
    }
}
