package com.sabia.auth.config;

import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Em produção não há data.sql: cria o administrador e o professor iniciais a partir de
 * SABIA_ADMIN_* e SABIA_PROFESSOR_*. Idempotente — usuário com o mesmo e-mail é mantido.
 */
@Component
@Profile("prod")
@RequiredArgsConstructor
@Slf4j
public class BootstrapUsuariosIniciais implements ApplicationRunner {

    static final String SENHA_PADRAO = "senha123";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;

    @Override
    public void run(ApplicationArguments args) {
        criarSeNaoExistir("SABIA_ADMIN", PerfilUsuario.ADMINISTRADOR, "Administrador", "00000000000");
        criarSeNaoExistir("SABIA_PROFESSOR", PerfilUsuario.PROFESSOR, "Professor", "00000000001");
    }

    private void criarSeNaoExistir(String prefixo, PerfilUsuario perfil, String nomePadrao, String cpfPadrao) {
        String email = valor(prefixo + "_EMAIL");
        if (email == null) {
            log.warn("{}_EMAIL não definido: usuário inicial {} não será criado.", prefixo, perfil);
            return;
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            log.info("Usuário inicial {} ({}) já existe; nada a fazer.", perfil, email);
            return;
        }

        String senha = valor(prefixo + "_SENHA");
        if (senha == null) {
            log.warn("{}_SENHA não definido: usuário inicial {} criado com a senha padrão. Troque-a.", prefixo, perfil);
            senha = SENHA_PADRAO;
        }

        usuarioRepository.save(Usuario.builder()
                .nome(valorOu(prefixo + "_NOME", nomePadrao))
                .email(email)
                .cpf(valorOu(prefixo + "_CPF", cpfPadrao))
                .senhaHash(passwordEncoder.encode(senha))
                .tipoPerfil(perfil)
                .build());
        log.info("Usuário inicial {} ({}) criado.", perfil, email);
    }

    private String valor(String chave) {
        String valor = env.getProperty(chave);
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String valorOu(String chave, String padrao) {
        String valor = valor(chave);
        return valor != null ? valor : padrao;
    }
}
