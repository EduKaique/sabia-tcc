package com.sabia.auth.exception;

public class SenhaAtualIncorretaException extends RuntimeException {
    public SenhaAtualIncorretaException() {
        super("Senha atual incorreta.");
    }
}
