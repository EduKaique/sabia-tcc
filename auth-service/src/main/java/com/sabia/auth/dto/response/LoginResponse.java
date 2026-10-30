package com.sabia.auth.dto.response;

public record LoginResponse(
        String token,
        String tipo,
        String role,
        String nome,
        boolean mustChangePassword
) {}
