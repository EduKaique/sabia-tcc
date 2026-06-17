package com.sabia.api.exception;

import java.util.UUID;

public class AtividadeNaoEncontradaException extends RuntimeException {
    public AtividadeNaoEncontradaException(UUID id) {
        super("Atividade com id " + id + " não encontrada.");
    }
}
