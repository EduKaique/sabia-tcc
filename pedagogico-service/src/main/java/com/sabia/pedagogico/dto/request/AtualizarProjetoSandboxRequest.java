package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.Size;

/** Campos opcionais; pelo menos um deve vir preenchido. O limite de 1 MB é conferido no service. */
public record AtualizarProjetoSandboxRequest(
        @Size(max = 100, message = "O nome do projeto deve ter no máximo 100 caracteres.")
        String nome,
        String estadoJson
) {
    public AtualizarProjetoSandboxRequest {
        nome = nome == null ? null : nome.trim();
    }
}
