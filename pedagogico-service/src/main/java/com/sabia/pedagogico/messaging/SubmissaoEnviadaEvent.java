package com.sabia.pedagogico.messaging;

/** Evento interno (Spring) disparado na transação da submissão; vira evento de integração após o commit. */
public record SubmissaoEnviadaEvent(Long submissaoId) {}
