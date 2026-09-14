package com.sabia.auth.exception;

public class SenhaDivergenteException extends RuntimeException {
    public SenhaDivergenteException() {
        super("As senhas não coincidem.");
    }
}
