package com.sabia.auth.exception;

import lombok.Getter;

/** 400 no mesmo formato da Bean Validation, para regras checadas no serviço. */
@Getter
public class CampoInvalidoException extends RuntimeException {

    private final String campo;

    public CampoInvalidoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }
}
