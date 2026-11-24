package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cria uma lição em rascunho. Textos chegam aparados, então os @Size valem para o texto aparado. */
public record CriarLicaoRequest(
        @NotBlank(message = "O título é obrigatório.")
        @Size(min = 3, max = 255, message = "O título deve ter entre 3 e 255 caracteres.")
        String titulo,
        @NotBlank(message = "O tema é obrigatório.")
        @Size(max = 255, message = "O tema deve ter no máximo 255 caracteres.")
        String conceito,
        @Size(max = 2000, message = "A descrição deve ter no máximo 2000 caracteres.")
        String resumo
) {
    public CriarLicaoRequest {
        titulo = aparar(titulo);
        conceito = aparar(conceito);
        resumo = aparar(resumo);
    }

    static String aparar(String valor) {
        return valor == null ? null : valor.trim();
    }
}
