package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * {@code login} é a matrícula (aluno) ou o e-mail (qualquer perfil); a regra fica no AuthService.
 * {@code email} é o nome antigo do campo, aceito só durante a transição do front.
 */
public record LoginRequest(
        @NotBlank(message = "Informe a matrícula ou o e-mail.") String login,
        String email,
        @NotBlank String senha
) {
    public LoginRequest {
        String valor = login == null || login.isBlank() ? email : login;
        login = valor == null ? null : valor.trim();
    }
}
