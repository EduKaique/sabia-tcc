package com.sabia.auth.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.List;

/**
 * No profile prod, impede a aplicação de subir sem os segredos obrigatórios, com um
 * JWT_SECRET fraco ou sem envio real de e-mail (EMAIL_PROVIDER=smtp e credenciais SMTP). Roda antes de qualquer bean (e de abrir conexão com o banco): o Spring
 * mantém placeholders sem default como texto literal em vez de falhar, por isso a checagem
 * é explícita. Registrado em META-INF/spring.factories.
 */
public class ValidacaoConfiguracaoProducao implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication application) {
        validar(env);
    }

    static void validar(Environment env) {
        if (!env.matchesProfiles("prod")) {
            return;
        }
        List<String> faltando = new ArrayList<>();
        exigir(env, faltando, "JWT_SECRET");
        exigir(env, faltando, "SPRING_DATASOURCE_PASSWORD", "DB_PASS");
        exigir(env, faltando, "SMTP_HOST");
        exigir(env, faltando, "SMTP_USERNAME");
        exigir(env, faltando, "SMTP_PASSWORD");
        exigir(env, faltando, "EMAIL_FROM");
        if (!faltando.isEmpty()) {
            throw new IllegalStateException(
                    "Variáveis obrigatórias no profile prod não definidas: " + String.join(", ", faltando));
        }
        // Já resolvida com o default de application.yml (dev): ausente também falha.
        if (!"smtp".equals(env.getProperty("sabia.email.provider"))) {
            throw new IllegalStateException(
                    "EMAIL_PROVIDER deve ser smtp no profile prod (dev grava links e senhas no log)");
        }
        JwtSecretValidator.validar(env.getProperty("JWT_SECRET"));
    }

    /** Exige ao menos uma das variáveis (nomes alternativos aceitos). */
    private static void exigir(Environment env, List<String> faltando, String... alternativas) {
        for (String nome : alternativas) {
            String valor = env.getProperty(nome);
            if (valor != null && !valor.isBlank()) {
                return;
            }
        }
        faltando.add(String.join(" ou ", alternativas));
    }

    @Override
    public int getOrder() {
        // Depois do ConfigDataEnvironmentPostProcessor, para os profiles já estarem ativos.
        return Ordered.LOWEST_PRECEDENCE;
    }
}
