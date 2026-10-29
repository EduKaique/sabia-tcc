package com.sabia.pedagogico.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtSecretValidatorTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void rejeitaSegredoAusente(String segredo) {
        assertThatThrownBy(() -> JwtSecretValidator.validar(segredo))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("obrigatório");
    }

    @Test
    void rejeitaSegredoComMenosDe32Bytes() {
        assertThatThrownBy(() -> JwtSecretValidator.validar("a".repeat(31)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void contaBytesUtf8ENaoCaracteres() {
        // 16 caracteres, 32 bytes em UTF-8
        assertThatCode(() -> JwtSecretValidator.validar("ç".repeat(16))).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @MethodSource("segredosConhecidos")
    void rejeitaDefaultsDoRepositorio(String segredo) {
        // "dev-secret-change-me" já cai na regra de tamanho; os demais na de default
        assertThatThrownBy(() -> JwtSecretValidator.validar(segredo))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejeitaDefaultLongo() {
        assertThatThrownBy(() -> JwtSecretValidator.validar(
                "dev-secret-change-in-production-must-be-at-least-32-chars"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("default");
    }

    @Test
    void aceitaSegredoForte() {
        assertThatCode(() -> JwtSecretValidator.validar("q7Vx2pLr9TzK4mWn8sYb1cHd6fGj3aEu5oRi0kNt"))
                .doesNotThrowAnyException();
    }

    static Set<String> segredosConhecidos() {
        return JwtSecretValidator.SEGREDOS_CONHECIDOS;
    }
}
