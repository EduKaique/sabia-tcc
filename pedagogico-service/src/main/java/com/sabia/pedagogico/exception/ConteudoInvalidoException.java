package com.sabia.pedagogico.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Conteúdo de lição inválido (páginas, limites). Vira 400 com {@code campos}, chaves como "paginas[2].alt".
 */
public class ConteudoInvalidoException extends RuntimeException {

    private final Map<String, String> campos;

    public ConteudoInvalidoException(Map<String, String> campos) {
        super("Conteúdo da lição inválido.");
        this.campos = Collections.unmodifiableMap(new LinkedHashMap<>(campos));
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
