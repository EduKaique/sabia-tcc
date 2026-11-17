package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** O nome chega sem espaços nas pontas, então o @Size vale para o texto aparado. */
public record CenarioRoboRequest(
        @NotBlank(message = "O nome do cenário é obrigatório.")
        @Size(min = 3, max = 100, message = "O nome do cenário deve ter entre 3 e 100 caracteres.")
        String nome,
        @NotBlank(message = "O cenário é obrigatório.")
        String cenarioJson
) {
    public CenarioRoboRequest {
        nome = nome == null ? null : nome.trim();
    }
}
