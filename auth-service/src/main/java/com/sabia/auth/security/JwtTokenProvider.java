package com.sabia.auth.security;

import com.sabia.auth.config.JwtProperties;
import com.sabia.auth.model.usuario.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    /** Perfil do token de serviço (auth-service → pedagogico). Não existe em PerfilUsuario. */
    public static final String PERFIL_SISTEMA = "SISTEMA";
    private static final long VALIDADE_TOKEN_SERVICO_MS = 60_000;
    // O pedagogico faz Long.parseLong(sub); 0 nunca é id de usuário (IDENTITY começa em 1).
    private static final String SUB_SISTEMA = "0";

    private final JwtProperties jwtProperties;

    public String generateToken(Usuario usuario) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(usuario.getId().toString())
                .claim("role", usuario.getTipoPerfil().name())
                .claim("nome", usuario.getNome())
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwtProperties.expirationMs()))
                .signWith(signingKey())
                .compact();
    }

    /** Token curto para chamadas internas ao Serviço Pedagógico. Nunca devolvido ao cliente. */
    public String generateServiceToken() {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(SUB_SISTEMA)
                .claim("role", PERFIL_SISTEMA)
                .claim("nome", "auth-service")
                .issuedAt(new Date(now))
                .expiration(new Date(now + VALIDADE_TOKEN_SERVICO_MS))
                .signWith(signingKey())
                .compact();
    }

    public boolean isServiceToken(Claims claims) {
        return PERFIL_SISTEMA.equals(claims.get("role", String.class));
    }

    public Long extractUserId(String token) {
        return Long.parseLong(extractClaims(token).getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token JWT inválido: {}", e.getMessage());
            return false;
        }
    }

    /** Parses and validates the token, returning its claims. Throws if invalid/expired. */
    public Claims extractClaims(String token) {
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
