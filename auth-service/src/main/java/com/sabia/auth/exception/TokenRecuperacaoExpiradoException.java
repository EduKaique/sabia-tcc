package com.sabia.auth.exception;

public class TokenRecuperacaoExpiradoException extends RuntimeException {
    public TokenRecuperacaoExpiradoException() {
        super("Este link expirou.");
    }
}
