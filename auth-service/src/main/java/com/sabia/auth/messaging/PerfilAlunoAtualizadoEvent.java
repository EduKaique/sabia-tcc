package com.sabia.auth.messaging;

/** Evento interno (Spring) disparado na transação; vira evento de integração após o commit. */
public record PerfilAlunoAtualizadoEvent(Long alunoId, String nomeCompleto) {}
