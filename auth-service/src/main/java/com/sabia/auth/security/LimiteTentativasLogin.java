package com.sabia.auth.security;

import com.sabia.auth.exception.LoginBloqueadoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite de tentativas de login por conta (login normalizado: trim + minúsculas), em memória.
 * Ao chegar a {@code max-falhas} falhas dentro da janela de {@code bloqueio-minutos}, a conta fica
 * bloqueada pelo mesmo tempo: o login responde 429 sem conferir a senha. Login certo zera.
 * Vale para logins inexistentes também, para não revelar se a conta existe.
 * Uma instância só: zera quando o serviço reinicia. Nunca loga senha nem o login completo.
 */
@Component
@Slf4j
public class LimiteTentativasLogin {

    static final int MAX_CHAVES = 10_000;

    private final int maxFalhas;
    private final Duration janela;
    private final Clock relogio;
    private final Map<String, Estado> estados = new ConcurrentHashMap<>();

    /** {@code ate}: fim da janela de contagem ou, se bloqueado, fim do bloqueio. */
    private record Estado(int falhas, Instant ate, boolean bloqueado) {}

    @Autowired
    public LimiteTentativasLogin(@Value("${sabia.login.max-falhas:10}") int maxFalhas,
                                 @Value("${sabia.login.bloqueio-minutos:15}") int bloqueioMinutos) {
        this(maxFalhas, bloqueioMinutos, Clock.systemUTC());
    }

    LimiteTentativasLogin(int maxFalhas, int bloqueioMinutos, Clock relogio) {
        this.maxFalhas = maxFalhas;
        this.janela = Duration.ofMinutes(bloqueioMinutos);
        this.relogio = relogio;
    }

    /** Lança {@link LoginBloqueadoException} se a conta estiver bloqueada. */
    public void verificar(String login) {
        String chave = chave(login);
        if (chave == null) {
            return;
        }
        Estado estado = estados.get(chave);
        Instant agora = relogio.instant();
        if (estado != null && estado.bloqueado() && agora.isBefore(estado.ate())) {
            // Arredonda para cima: o cliente nunca tenta antes do fim do bloqueio.
            long segundos = Math.max(1, (Duration.between(agora, estado.ate()).toMillis() + 999) / 1000);
            throw new LoginBloqueadoException(segundos);
        }
    }

    public void registrarFalha(String login) {
        String chave = chave(login);
        if (chave == null) {
            return;
        }
        Instant agora = relogio.instant();
        if (!estados.containsKey(chave) && estados.size() >= MAX_CHAVES) {
            limparExpirados(agora);
            if (estados.size() >= MAX_CHAVES) {
                log.warn("Limite de tentativas de login: {} contas em memória; falha não registrada.", MAX_CHAVES);
                return;
            }
        }
        Estado novo = estados.compute(chave, (k, atual) -> {
            boolean expirado = atual == null || !agora.isBefore(atual.ate());
            int falhas = expirado ? 1 : atual.falhas() + 1;
            if (falhas >= maxFalhas) {
                return new Estado(falhas, agora.plus(janela), true);
            }
            return new Estado(falhas, expirado ? agora.plus(janela) : atual.ate(), false);
        });
        if (novo.bloqueado() && novo.falhas() == maxFalhas) {
            log.warn("Login {} bloqueado por {} min após {} tentativas erradas.",
                    mascarar(chave), janela.toMinutes(), maxFalhas);
        }
    }

    public void registrarSucesso(String login) {
        liberar(login);
    }

    /** Zera o contador das contas (ex.: o professor redefiniu a senha do aluno). */
    public void liberar(String... logins) {
        for (String login : logins) {
            String chave = chave(login);
            if (chave != null) {
                estados.remove(chave);
            }
        }
    }

    private void limparExpirados(Instant agora) {
        estados.values().removeIf(e -> !agora.isBefore(e.ate()));
    }

    private static String chave(String login) {
        if (login == null || login.isBlank()) {
            return null;
        }
        return login.trim().toLowerCase(Locale.ROOT);
    }

    private static String mascarar(String chave) {
        return chave.length() <= 2 ? "***" : chave.substring(0, 2) + "***";
    }
}
