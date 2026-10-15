package com.sabia.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Locale;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String senha
) {
    /** Teclados de tablet capitalizam a primeira letra: o e-mail é sempre comparado em minúsculas. */
    public LoginRequest {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
