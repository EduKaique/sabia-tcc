package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EntrarTurmaRequest(
        @NotBlank(message = "O código da turma é obrigatório.") String codigo
) {}
