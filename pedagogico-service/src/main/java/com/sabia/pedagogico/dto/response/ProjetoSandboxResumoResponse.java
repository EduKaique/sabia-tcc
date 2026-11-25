package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.sandbox.ModoProjetoSandbox;
import com.sabia.pedagogico.model.sandbox.ProjetoSandbox;

import java.time.LocalDateTime;

/** Item da galeria "Meus Projetos" (sem o estado do Blockly). */
public record ProjetoSandboxResumoResponse(
        Long id,
        String nome,
        ModoProjetoSandbox modo,
        LocalDateTime atualizadoEm
) {
    public static ProjetoSandboxResumoResponse from(ProjetoSandbox p) {
        return new ProjetoSandboxResumoResponse(p.getId(), p.getNome(), p.getModo(), p.getAtualizadoEm());
    }
}
