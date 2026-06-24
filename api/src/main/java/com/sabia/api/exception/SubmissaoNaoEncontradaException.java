package com.sabia.api.exception;

public class SubmissaoNaoEncontradaException extends RuntimeException {
    public SubmissaoNaoEncontradaException(Long id) {
        super("Submissão com id " + id + " não encontrada.");
    }
}
