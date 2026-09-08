package com.sabia.auth.service;

import com.sabia.auth.dto.request.LoginRequest;
import com.sabia.auth.dto.response.LoginResponse;
import com.sabia.auth.dto.response.ValidateResponse;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        var usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha incorretos"));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("E-mail ou senha incorretos");
        }

        String token = jwtTokenProvider.generateToken(usuario);
        log.info("Login bem-sucedido para usuário id={}", usuario.getId());
        return new LoginResponse(token, "Bearer", usuario.getTipoPerfil().name(), usuario.getNome());
    }

    /**
     * Verifica a assinatura e a validade de um token JWT. Usado pelo API Gateway
     * como alternativa ao segredo HMAC compartilhado.
     */
    public ValidateResponse validar(String token) {
        try {
            Claims claims = jwtTokenProvider.extractClaims(token);
            return new ValidateResponse(
                    true,
                    Long.valueOf(claims.getSubject()),
                    claims.get("perfil", String.class),
                    claims.get("nome", String.class),
                    claims.getExpiration().toInstant()
            );
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Falha ao validar token: {}", e.getMessage());
            return ValidateResponse.invalido();
        }
    }
}
