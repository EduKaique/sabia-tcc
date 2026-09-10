package com.sabia.pedagogico.exception;

public class SubmissaoNaoEncontradaException extends RuntimeException {
    public SubmissaoNaoEncontradaException(Long id) {
        super("Submissão com id " + id + " não encontrada.");
    }
}
