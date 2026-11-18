package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Edição do próprio perfil: nome (qualquer perfil) e avatar (só aluno; nulo mantém o atual).
 * A regra do avatar depende do perfil e fica no PerfilService.
 */
public record EditarPerfilRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 3, max = 255, message = "O nome deve ter entre 3 e 255 caracteres.") String nome,
        String avatar
) {
    public EditarPerfilRequest {
        nome = nome == null ? null : nome.trim();
        avatar = avatar == null ? null : avatar.trim();
    }

    /** Dados pessoais nunca vão para log (ex.: DEBUG do Spring MVC imprime o corpo lido). */
    @Override
    public String toString() {
        return "EditarPerfilRequest[dados omitidos]";
    }
}
