package com.sabia.auth.exception;

public class ProfessorNaoEncontradoException extends RuntimeException {
    public ProfessorNaoEncontradoException() {
        super("Professor não encontrado.");
    }
}
