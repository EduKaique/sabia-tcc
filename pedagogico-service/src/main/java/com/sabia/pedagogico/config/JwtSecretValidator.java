package com.sabia.pedagogico.config;

import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Regras do JWT_SECRET em produção: no mínimo 32 bytes (HS256) e diferente dos defaults
 * conhecidos do repositório. Chamado por {@link ValidacaoConfiguracaoProducao}.
 */
public final class JwtSecretValidator {

    static final int TAMANHO_MINIMO_BYTES = 32;

    static final Set<String> SEGREDOS_CONHECIDOS = Set.of(
            "dev-secret-change-in-production-must-be-at-least-32-chars",
            "dev-secret-change-me",
            "test-secret-test-secret-test-secret-test-secret"
    );

    private JwtSecretValidator() {}

    public static void validar(String segredo) {
        if (segredo == null || segredo.isBlank()) {
            throw new IllegalStateException("JWT_SECRET é obrigatório no profile prod.");
        }
        if (segredo.getBytes(StandardCharsets.UTF_8).length < TAMANHO_MINIMO_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET deve ter no mínimo " + TAMANHO_MINIMO_BYTES + " bytes no profile prod.");
        }
        if (SEGREDOS_CONHECIDOS.contains(segredo)) {
            throw new IllegalStateException(
                    "JWT_SECRET não pode ser um valor default do repositório no profile prod.");
        }
    }
}
