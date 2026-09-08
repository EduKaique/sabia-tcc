package com.sabia.auth.dto.response;

public record LoginResponse(
        String token,
        String tipo,
        String perfil,
        String nome
) {}
