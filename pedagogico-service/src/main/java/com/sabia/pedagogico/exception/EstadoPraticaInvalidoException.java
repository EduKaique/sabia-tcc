package com.sabia.pedagogico.exception;

/** Projeto (estadoJson) ilegível: não é JSON ou passa do limite de aninhamento. Vira 400. */
public class EstadoPraticaInvalidoException extends RuntimeException {
    public EstadoPraticaInvalidoException(String message) {
        super(message);
    }
}
