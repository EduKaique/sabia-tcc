package com.sabia.pedagogico.dto.request;

import com.sabia.pedagogico.model.relatorio.TipoRelatorio;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record RelatorioRequest(
        TipoRelatorio tipo,
        Long turmaId,
        Long atividadeId,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
        Boolean incluirDetalhes
) {
    public TipoRelatorio tipoOrDefault() {
        return tipo == null ? TipoRelatorio.GERAL : tipo;
    }

    public boolean incluirDetalhesOrDefault() {
        return incluirDetalhes == null || incluirDetalhes;
    }
}
