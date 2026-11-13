package com.sabia.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ValidacaoConfiguracaoProducaoTest {

    private static final String SEGREDO_FORTE = "q7Vx2pLr9TzK4mWn8sYb1cHd6fGj3aEu5oRi0kNt";

    @Test
    void foraDoProfileProdNaoExigeNada() {
        assertThatCode(() -> ValidacaoConfiguracaoProducao.validar(new MockEnvironment()))
                .doesNotThrowAnyException();
    }

    @Test
    void falhaListandoTodasAsVariaveisFaltando() {
        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(prod()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("SPRING_DATASOURCE_PASSWORD ou DB_PASS");
    }

    @Test
    void aceitaSenhaDoBancoEmQualquerUmDosNomes() {
        assertThatCode(() -> ValidacaoConfiguracaoProducao.validar(completo()
                .withProperty("SPRING_DATASOURCE_PASSWORD", "senha-forte")))
                .doesNotThrowAnyException();
        assertThatCode(() -> ValidacaoConfiguracaoProducao.validar(completo()
                .withProperty("DB_PASS", "senha-forte")))
                .doesNotThrowAnyException();
    }

    @Test
    void falhaComJwtSecretFraco() {
        MockEnvironment env = completo()
                .withProperty("DB_PASS", "senha-forte")
                .withProperty("JWT_SECRET", "dev-secret-change-in-production-must-be-at-least-32-chars");

        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("default");
    }

    @Test
    void falhaListandoAsVariaveisSmtpFaltando() {
        MockEnvironment env = prod()
                .withProperty("JWT_SECRET", SEGREDO_FORTE)
                .withProperty("DB_PASS", "senha-forte")
                .withProperty("sabia.email.provider", "smtp")
                .withProperty("SMTP_HOST", "smtp.exemplo.invalid");

        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SMTP_USERNAME")
                .hasMessageContaining("SMTP_PASSWORD")
                .hasMessageContaining("EMAIL_FROM")
                .hasMessageNotContaining("SMTP_HOST");
    }

    @Test
    void falhaComEmailProviderDev() {
        MockEnvironment env = completo()
                .withProperty("DB_PASS", "senha-forte")
                .withProperty("sabia.email.provider", "dev");

        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("EMAIL_PROVIDER deve ser smtp");
    }

    @Test
    void falhaComEmailProviderVazioOuAusente() {
        MockEnvironment vazio = completo()
                .withProperty("DB_PASS", "senha-forte")
                .withProperty("sabia.email.provider", "");
        MockEnvironment semProvider = prod()
                .withProperty("JWT_SECRET", SEGREDO_FORTE)
                .withProperty("DB_PASS", "senha-forte")
                .withProperty("SMTP_HOST", "smtp.exemplo.invalid")
                .withProperty("SMTP_USERNAME", "usuario")
                .withProperty("SMTP_PASSWORD", "senha-smtp")
                .withProperty("EMAIL_FROM", "remetente@exemplo.invalid");

        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(vazio))
                .hasMessageContaining("EMAIL_PROVIDER deve ser smtp");
        assertThatThrownBy(() -> ValidacaoConfiguracaoProducao.validar(semProvider))
                .hasMessageContaining("EMAIL_PROVIDER deve ser smtp");
    }

    @Test
    void aceitaProdComSmtpCompleto() {
        assertThatCode(() -> ValidacaoConfiguracaoProducao.validar(completo().withProperty("DB_PASS", "senha-forte")))
                .doesNotThrowAnyException();
    }

    private static MockEnvironment prod() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        return env;
    }

    /** Tudo definido (SMTP inclusive), menos a senha do banco. */
    private static MockEnvironment completo() {
        return prod()
                .withProperty("JWT_SECRET", SEGREDO_FORTE)
                .withProperty("sabia.email.provider", "smtp")
                .withProperty("SMTP_HOST", "smtp.exemplo.invalid")
                .withProperty("SMTP_USERNAME", "usuario")
                .withProperty("SMTP_PASSWORD", "senha-smtp")
                .withProperty("EMAIL_FROM", "remetente@exemplo.invalid");
    }
}
