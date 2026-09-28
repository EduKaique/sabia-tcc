package com.sabia.auth.exception;

public class PerfilNaoAplicavelException extends RuntimeException {
    public PerfilNaoAplicavelException() {
        super("Esse recurso é exclusivo para alunos.");
    }
}
