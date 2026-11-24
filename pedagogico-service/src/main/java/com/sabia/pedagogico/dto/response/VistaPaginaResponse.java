package com.sabia.pedagogico.dto.response;

/** POST .../paginas/{paginaId}/vista. */
public record VistaPaginaResponse(Long paginaId, boolean concluida, boolean praticaLiberada) {}
