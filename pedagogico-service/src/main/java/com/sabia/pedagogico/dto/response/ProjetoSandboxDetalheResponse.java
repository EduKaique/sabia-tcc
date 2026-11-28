package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.sandbox.ProjetoSandbox;

import java.time.LocalDateTime;

public record ProjetoSandboxDetalheResponse(
        Long id,
        String nome,
        ModoPratica modo,
        String estadoJson,
        String cenarioJson,
        Long origemAtividadeId,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public static ProjetoSandboxDetalheResponse from(ProjetoSandbox p) {
        return new ProjetoSandboxDetalheResponse(p.getId(), p.getNome(), p.getModo(), p.getEstadoJson(),
                p.getCenarioJson(), p.getOrigemAtividadeId(), p.getCriadoEm(), p.getAtualizadoEm());
    }
}
