package com.sabia.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarProfessorRequest(
        @NotBlank String nomeCompleto,
        @NotBlank @Size(min = 11, max = 11, message = "CPF deve ter 11 dígitos") String cpf,
        @NotBlank @Email String email
) {}
