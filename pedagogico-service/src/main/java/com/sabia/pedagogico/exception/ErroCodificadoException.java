package com.sabia.pedagogico.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Erro de regra de negócio com um código estável no corpo ({@code codigo}), para o front tratar o
 * caso sem depender do texto da mensagem.
 */
@Getter
public class ErroCodificadoException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    public ErroCodificadoException(HttpStatus status, String codigo, String mensagem) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
    }
}
