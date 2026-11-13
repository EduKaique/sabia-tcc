package com.sabia.pedagogico.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioIaRequest(
        @Size(max = 5000) String resumo,
        BigDecimal notaSugerida,
        @Size(max = 100) List<@NotBlank @Size(max = 1000) String> acertos,
        @Size(max = 100) List<@Valid Erro> erros
) {
    public record Erro(@NotBlank @Size(max = 1000) String descricao, @Size(max = 30) String severidade) {}
}
