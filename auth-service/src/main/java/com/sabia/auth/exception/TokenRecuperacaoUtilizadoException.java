package com.sabia.auth.exception;

public class TokenRecuperacaoUtilizadoException extends RuntimeException {
    public TokenRecuperacaoUtilizadoException() {
        super("Este link já foi utilizado.");
    }
}
