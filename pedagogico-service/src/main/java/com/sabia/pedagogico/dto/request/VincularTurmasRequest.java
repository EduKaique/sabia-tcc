package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Substitui as turmas da lição; lista vazia desvincula todas. Duplicatas são ignoradas. */
public record VincularTurmasRequest(
        @NotNull(message = "A lista de turmas é obrigatória.")
        List<@NotNull(message = "Turma inválida.") Long> turmaIds
) {}
