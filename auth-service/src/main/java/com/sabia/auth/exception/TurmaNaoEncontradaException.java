package com.sabia.auth.exception;

/** Turma inexistente ou de outro professor: mesma mensagem, para não revelar que ela existe. */
public class TurmaNaoEncontradaException extends RuntimeException {
    public TurmaNaoEncontradaException() {
        super("Turma não encontrada.");
    }
}
