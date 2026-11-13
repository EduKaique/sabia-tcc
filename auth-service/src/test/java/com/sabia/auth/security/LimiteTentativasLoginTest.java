package com.sabia.auth.security;

import com.sabia.auth.exception.LoginBloqueadoException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LimiteTentativasLoginTest {

    /** Relógio que o teste avança manualmente. */
    static class RelogioManual extends Clock {
        private Instant agora = Instant.parse("2026-11-13T10:00:00Z");

        void avancar(Duration duracao) { agora = agora.plus(duracao); }
        @Override public Instant instant() { return agora; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
    }

    private final RelogioManual relogio = new RelogioManual();
    private final LimiteTentativasLogin limite = new LimiteTentativasLogin(10, 15, relogio);

    private void falhar(String login, int vezes) {
        for (int i = 0; i < vezes; i++) {
            limite.registrarFalha(login);
        }
    }

    @Test
    void noveFalhasNaoBloqueiamEADecimaBloqueia() {
        falhar("2026AB01", 9);
        assertThatCode(() -> limite.verificar("2026AB01")).doesNotThrowAnyException();

        falhar("2026AB01", 1);
        assertThatThrownBy(() -> limite.verificar("2026AB01"))
                .isInstanceOf(LoginBloqueadoException.class)
                .satisfies(e -> assertThat(((LoginBloqueadoException) e).getSegundosRestantes()).isEqualTo(900));
    }

    @Test
    void normalizaEspacosEMaiusculas() {
        falhar(" Aluno@Escola.EDU ", 10);
        assertThatThrownBy(() -> limite.verificar("aluno@escola.edu")).isInstanceOf(LoginBloqueadoException.class);
    }

    @Test
    void bloqueioExpiraDepoisDaJanela() {
        falhar("2026AB01", 10);
        relogio.avancar(Duration.ofMinutes(15));
        assertThatCode(() -> limite.verificar("2026AB01")).doesNotThrowAnyException();
    }

    @Test
    void falhasAntigasSaemDaJanela() {
        falhar("2026AB01", 9);
        relogio.avancar(Duration.ofMinutes(15));
        falhar("2026AB01", 9);
        assertThatCode(() -> limite.verificar("2026AB01")).doesNotThrowAnyException();
    }

    @Test
    void outraContaNaoEhAfetada() {
        falhar("2026AB01", 10);
        assertThatCode(() -> limite.verificar("2026AB02")).doesNotThrowAnyException();
    }

    @Test
    void sucessoZeraOContador() {
        falhar("2026AB01", 9);
        limite.registrarSucesso("2026ab01");
        falhar("2026AB01", 9);
        assertThatCode(() -> limite.verificar("2026AB01")).doesNotThrowAnyException();
    }

    @Test
    void liberarDesbloqueiaPorMatriculaOuEmailEIgnoraNulo() {
        falhar("2026AB01", 10);
        falhar("aluno@escola.edu", 10);

        limite.liberar(null, "2026ab01", "ALUNO@escola.edu");

        assertThatCode(() -> limite.verificar("2026AB01")).doesNotThrowAnyException();
        assertThatCode(() -> limite.verificar("aluno@escola.edu")).doesNotThrowAnyException();
    }
}
