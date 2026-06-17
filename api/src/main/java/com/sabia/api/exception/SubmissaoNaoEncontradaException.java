package com.sabia.api.exception;

import java.util.UUID;

public class SubmissaoNaoEncontradaException extends RuntimeException {
    public SubmissaoNaoEncontradaException(UUID id) {
        super("Submissão com id " + id + " não encontrada.");
    }
}
