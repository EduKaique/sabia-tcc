package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MatricularAlunoRequest(
        @NotNull(message = "O aluno é obrigatório.") @Positive(message = "Aluno inválido.") Long alunoId,
        @NotBlank(message = "O nome do aluno é obrigatório.")
        @Size(max = 255, message = "O nome do aluno deve ter no máximo 255 caracteres.") String alunoNome
) {}
