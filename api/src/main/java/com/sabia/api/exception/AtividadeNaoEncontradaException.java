package com.sabia.api.exception;

public class AtividadeNaoEncontradaException extends RuntimeException {
    public AtividadeNaoEncontradaException(Long id) {
        super("Atividade com id " + id + " não encontrada.");
    }
}
