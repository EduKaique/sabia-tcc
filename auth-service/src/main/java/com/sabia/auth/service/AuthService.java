package com.sabia.auth.service;

import com.sabia.auth.dto.request.LoginRequest;
import com.sabia.auth.dto.request.TrocarSenhaRequest;
import com.sabia.auth.dto.response.LoginResponse;
import com.sabia.auth.dto.response.ValidateResponse;
import com.sabia.auth.exception.SenhaAtualIncorretaException;
import com.sabia.auth.exception.SenhaDivergenteException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.exception.UsuarioInativoException;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import com.sabia.auth.security.LimiteTentativasLogin;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String MSG_CREDENCIAIS_INVALIDAS = "Dados de acesso incorretos";

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LimiteTentativasLogin limiteTentativas;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // Bloqueada: responde 429 sem conferir a senha (nem a correta).
        limiteTentativas.verificar(request.login());

        var usuario = buscarPorLogin(request.login()).orElse(null);
        if (usuario == null || !passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            // Conta inexistente também conta, para não revelar se o login existe.
            limiteTentativas.registrarFalha(request.login());
            throw new BadCredentialsException(MSG_CREDENCIAIS_INVALIDAS);
        }
        limiteTentativas.registrarSucesso(request.login());
        if (!usuario.isAtivo()) {
            throw new UsuarioInativoException();
        }

        String token = jwtTokenProvider.generateToken(usuario);
        log.info("Login bem-sucedido para usuário id={}", usuario.getId());
        return new LoginResponse(token, "Bearer", usuario.getTipoPerfil().name(), usuario.getNome(),
                usuario.isMustChangePassword());
    }

    private Optional<Usuario> buscarPorLogin(String login) {
        if (login.contains("@")) {
            return usuarioRepository.findByEmailIgnoreCase(login.toLowerCase(Locale.ROOT));
        }
        return alunoRepository.findByMatricula(Aluno.normalizarMatricula(login))
                .map(Aluno::getUsuario)
                .filter(u -> u.getTipoPerfil() == PerfilUsuario.ALUNO);
    }

    /** Devolve um token novo, já sem a claim de troca pendente. */
    @Transactional
    public LoginResponse trocarSenha(Usuario usuario, TrocarSenhaRequest request) {
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new SenhaAtualIncorretaException();
        }
        if (!request.novaSenha().equals(request.confirmarSenha())) {
            throw new SenhaDivergenteException();
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuario.setMustChangePassword(false);
        usuarioRepository.save(usuario);

        log.info("Senha alterada pelo próprio usuário id={}", usuario.getId());
        return new LoginResponse(jwtTokenProvider.generateToken(usuario), "Bearer",
                usuario.getTipoPerfil().name(), usuario.getNome(), false);
    }

    /**
     * Verifica a assinatura e a validade de um token JWT. Usado pelo API Gateway
     * como alternativa ao segredo HMAC compartilhado.
     */
    @Transactional(readOnly = true)
    public ValidateResponse validar(String token) {
        try {
            Claims claims = jwtTokenProvider.extractClaims(token);
            Long usuarioId = Long.valueOf(claims.getSubject());

            boolean ativo = usuarioRepository.findById(usuarioId)
                    .map(Usuario::isAtivo)
                    .orElse(false);
            if (!ativo) {
                return ValidateResponse.invalido();
            }

            if (jwtTokenProvider.isServiceToken(claims)) {
                // Token de serviço não é sessão de usuário.
                return ValidateResponse.invalido();
            }
            return new ValidateResponse(
                    true,
                    Long.valueOf(claims.getSubject()),
                    claims.get("role", String.class),
                    claims.get("nome", String.class),
                    claims.getExpiration().toInstant()
            );
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Falha ao validar token: {}", e.getMessage());
            return ValidateResponse.invalido();
        }
    }
}
