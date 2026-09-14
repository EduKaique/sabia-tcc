package com.sabia.auth.exception;

public class TokenRecuperacaoInvalidoException extends RuntimeException {
    public TokenRecuperacaoInvalidoException() {
        super("Link inválido.");
    }
}
