package com.sabia.auth.exception;

public class MatriculaJaCadastradaException extends RuntimeException {
    public MatriculaJaCadastradaException() {
        super("Matrícula já cadastrada.");
    }
}
