package com.sabia.auth.dto.response;

public record MeResponse(
        Long id,
        String nome,
        String email,
        String perfil
) {}
