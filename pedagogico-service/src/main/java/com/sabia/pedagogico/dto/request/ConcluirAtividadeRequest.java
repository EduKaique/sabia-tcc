package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Projeto do aluno (JSON do Blockly) enviado para o servidor decidir a conclusão da prática da lição. */
public record ConcluirAtividadeRequest(
        @NotBlank(message = "Envie o projeto para concluir a prática.")
        @Size(max = 65536, message = "O projeto passa do limite de 64 KB.")
        String estadoJson
) {}
