package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PerfilRequest(
        @NotBlank String nomeCompleto,
        @NotBlank @Size(min = 11, max = 11, message = "CPF deve ter 11 dígitos") String cpf,
        @NotBlank String matricula,
        @NotBlank String avatar
) {}
