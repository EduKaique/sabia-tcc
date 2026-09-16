package com.sabia.pedagogico.security;

import com.sabia.pedagogico.config.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Só valida/lê tokens emitidos pelo módulo {@code api} (Serviço de Autenticação) — este
 * serviço nunca emite JWT. Não depende de nenhuma entidade Usuario/repositório: o próprio
 * token já carrega {@code sub} (id do usuário) e a claim {@code perfil}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenReader {

    private final JwtProperties jwtProperties;

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token JWT inválido: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) {
        return Long.parseLong(extractClaims(token).getSubject());
    }

    public String extractPerfil(String token) {
        return extractClaims(token).get("perfil", String.class);
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }
}
