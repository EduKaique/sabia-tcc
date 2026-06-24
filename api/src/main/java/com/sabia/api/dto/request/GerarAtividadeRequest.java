package com.sabia.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GerarAtividadeRequest(
        @NotNull Long idTurma,
        @NotBlank String tipoAtividade,
        @NotBlank String descricaoObjetivo
) {}
