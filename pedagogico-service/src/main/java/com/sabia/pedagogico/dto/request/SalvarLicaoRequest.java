package com.sabia.pedagogico.dto.request;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Salvamento completo da lição: metadados, prática e a lista ORDENADA de páginas (substitui a anterior).
 * {@code cenarioJson} é string, como na atividade; em BLOCOS é ignorado.
 */
public record SalvarLicaoRequest(
        @NotBlank(message = "O título é obrigatório.")
        @Size(min = 3, max = 255, message = "O título deve ter entre 3 e 255 caracteres.")
        String titulo,
        @NotBlank(message = "O tema é obrigatório.")
        @Size(max = 255, message = "O tema deve ter no máximo 255 caracteres.")
        String conceito,
        @Size(max = 2000, message = "A descrição deve ter no máximo 2000 caracteres.")
        String resumo,
        @NotNull(message = "O modo da prática é obrigatório.")
        ModoAtividade modo,
        String cenarioJson,
        @NotNull(message = "A lista de páginas é obrigatória.")
        @Size(max = 30, message = "A lição pode ter no máximo 30 páginas.")
        List<@Valid @NotNull(message = "Página vazia.") PaginaLicaoRequest> paginas
) {
    public SalvarLicaoRequest {
        titulo = CriarLicaoRequest.aparar(titulo);
        conceito = CriarLicaoRequest.aparar(conceito);
        resumo = CriarLicaoRequest.aparar(resumo);
    }
}
