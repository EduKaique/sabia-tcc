package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Nome novo do aluno, enviado pelo auth-service quando o aluno edita o próprio perfil. */
public record AtualizarNomeAlunoRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 3, max = 255, message = "O nome deve ter entre 3 e 255 caracteres.") String nome
) {
    public AtualizarNomeAlunoRequest {
        nome = nome == null ? null : nome.trim();
    }

    /** Dados pessoais nunca vão para log. */
    @Override
    public String toString() {
        return "AtualizarNomeAlunoRequest[dados omitidos]";
    }
}
