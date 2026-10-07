package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code termo} pode ser e-mail, CPF (com ou sem máscara) ou matrícula. */
public record BuscarAlunoRequest(
        @NotBlank(message = "Informe o e-mail, CPF ou matrícula do aluno.")
        @Size(max = 255, message = "Termo de busca muito longo.") String termo
) {}
