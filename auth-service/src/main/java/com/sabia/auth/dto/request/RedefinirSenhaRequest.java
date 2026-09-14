package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String novaSenha,
        @NotBlank String confirmarSenha
) {}
