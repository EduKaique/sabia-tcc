package com.sabia.pedagogico.dto.response;

/** POST .../paginas/{paginaId}/video/pulso: crédito acumulado pelo relógio do servidor. */
public record PulsoVideoResponse(
        Long paginaId,
        int segundosCreditados,
        int segundosNecessarios,
        boolean conferido,
        boolean praticaLiberada
) {}
