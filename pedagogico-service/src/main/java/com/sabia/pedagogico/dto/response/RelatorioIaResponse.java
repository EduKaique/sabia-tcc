package com.sabia.pedagogico.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioIaResponse(
        String resumo,
        BigDecimal notaSugerida,
        List<String> acertos,
        List<Erro> erros
) {
    public record Erro(String descricao, String severidade) {}
}
