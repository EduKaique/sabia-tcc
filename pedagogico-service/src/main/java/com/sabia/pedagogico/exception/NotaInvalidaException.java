package com.sabia.pedagogico.exception;

/** Nota da correção fora do intervalo permitido pela atividade; vira 400 com {@code campos.nota}. */
public class NotaInvalidaException extends RuntimeException {
    public NotaInvalidaException(String message) {
        super(message);
    }
}
