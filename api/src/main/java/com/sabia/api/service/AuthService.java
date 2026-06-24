package com.sabia.api.service;

import com.sabia.api.dto.request.LoginRequest;
import com.sabia.api.dto.response.LoginResponse;
import com.sabia.api.repository.UsuarioRepository;
import com.sabia.api.security.JwtTokenProvider;
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
}
