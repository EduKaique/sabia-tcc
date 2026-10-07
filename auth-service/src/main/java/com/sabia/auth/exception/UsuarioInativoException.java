package com.sabia.auth.exception;

public class UsuarioInativoException extends RuntimeException {
    public UsuarioInativoException() {
        super("Usuário inativo.");
    }
}
