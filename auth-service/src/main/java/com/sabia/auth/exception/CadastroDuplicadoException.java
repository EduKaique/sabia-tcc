package com.sabia.auth.exception;

import lombok.Getter;

/** 409 do primeiro acesso, indicando o campo em conflito (matrícula). */
@Getter
public class CadastroDuplicadoException extends RuntimeException {

    private final String campo;

    private CadastroDuplicadoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }

    public static CadastroDuplicadoException matricula() {
        return new CadastroDuplicadoException("matricula", "Matrícula já cadastrada.");
    }
}
