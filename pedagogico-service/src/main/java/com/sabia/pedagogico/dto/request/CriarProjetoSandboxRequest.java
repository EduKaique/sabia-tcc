package com.sabia.pedagogico.dto.request;

import com.sabia.pedagogico.model.sandbox.ModoProjetoSandbox;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Novo projeto do Sandbox. {@code cenario} é o id de um cenário pronto (ex.: "livre-5x5") e só vale
 * no modo ROBO. Nome ausente ou vazio vira "Projeto sem título".
 */
public record CriarProjetoSandboxRequest(
        @Size(max = 100, message = "O nome do projeto deve ter no máximo 100 caracteres.")
        String nome,
        @NotNull(message = "O tipo do projeto é obrigatório.")
        ModoProjetoSandbox modo,
        String cenario
) {
    public CriarProjetoSandboxRequest {
        nome = nome == null ? null : nome.trim();
    }
}
