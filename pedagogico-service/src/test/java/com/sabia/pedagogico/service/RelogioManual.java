package com.sabia.pedagogico.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Relógio de teste que só anda quando mandado (mesmo padrão do LimiteTentativasLoginTest do auth-service). */
public class RelogioManual extends Clock {

    private Instant agora;

    public RelogioManual(Instant inicio) {
        this.agora = inicio;
    }

    public void avancar(Duration d) {
        agora = agora.plus(d);
    }

    public void avancarSegundos(long s) {
        avancar(Duration.ofSeconds(s));
    }

    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return agora; }
}
