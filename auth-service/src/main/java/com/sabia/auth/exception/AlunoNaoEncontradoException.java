package com.sabia.auth.exception;

public class AlunoNaoEncontradoException extends RuntimeException {
    public AlunoNaoEncontradoException() {
        super("Aluno não encontrado.");
    }
}
