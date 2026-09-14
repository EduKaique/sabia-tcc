package com.sabia.auth.service;

import com.sabia.auth.exception.SenhaDivergenteException;
import com.sabia.auth.exception.TokenRecuperacaoExpiradoException;
import com.sabia.auth.exception.TokenRecuperacaoInvalidoException;
import com.sabia.auth.exception.TokenRecuperacaoUtilizadoException;
import com.sabia.auth.model.recuperacaosenha.TokenRecuperacaoSenha;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.TokenRecuperacaoSenhaRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecuperacaoSenhaService {

    private static final int VALIDADE_HORAS = 24;
    private static final String MENSAGEM_PADRAO =
            "Se o e-mail informado estiver cadastrado, você receberá as instruções de recuperação em instantes.";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacaoSenhaRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${sabia.frontend.recuperar-senha-url:http://localhost:3000/recuperar-senha}")
    private String recuperarSenhaUrl;

    @Transactional
    public String esqueciSenha(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String tokenBruto = gerarTokenBruto();

            TokenRecuperacaoSenha token = TokenRecuperacaoSenha.builder()
                    .usuario(usuario)
                    .hashToken(hash(tokenBruto))
                    .expiraEm(LocalDateTime.now(ZoneOffset.UTC).plusHours(VALIDADE_HORAS))
                    .build();
            tokenRepository.save(token);

            String link = recuperarSenhaUrl + "?token=" + tokenBruto;
            emailService.enviarLinkRecuperacaoSenha(usuario.getEmail(), usuario.getNome(), link);
            log.info("Token de recuperação de senha gerado para usuário id={}", usuario.getId());
        });

        return MENSAGEM_PADRAO;
    }

    @Transactional
    public void redefinirSenha(String tokenBruto, String novaSenha, String confirmarSenha) {
        if (!novaSenha.equals(confirmarSenha)) {
            throw new SenhaDivergenteException();
        }

        TokenRecuperacaoSenha token = tokenRepository.findByHashToken(hash(tokenBruto))
                .orElseThrow(TokenRecuperacaoInvalidoException::new);

        if (token.getUsadoEm() != null) {
            throw new TokenRecuperacaoUtilizadoException();
        }
        if (token.getExpiraEm().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new TokenRecuperacaoExpiradoException();
        }

        Usuario usuario = token.getUsuario();
        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);

        LocalDateTime agora = LocalDateTime.now(ZoneOffset.UTC);
        token.setUsadoEm(agora);
        tokenRepository.save(token);

        tokenRepository.findByUsuarioIdAndUsadoEmIsNullAndIdNot(usuario.getId(), token.getId())
                .forEach(outro -> outro.setUsadoEm(agora));

        log.info("Senha redefinida com sucesso para usuário id={}", usuario.getId());
    }

    private String gerarTokenBruto() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(valor.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
