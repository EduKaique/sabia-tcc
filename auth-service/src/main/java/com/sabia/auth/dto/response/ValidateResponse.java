package com.sabia.auth.dto.response;

import java.time.Instant;

/** Resultado da verificação de um token JWT — consumido pelo API Gateway. */
public record ValidateResponse(
        boolean valido,
        Long usuarioId,
        String perfil,
        String nome,
        Instant expiraEm
) {
    public static ValidateResponse invalido() {
        return new ValidateResponse(false, null, null, null, null);
    }
}
