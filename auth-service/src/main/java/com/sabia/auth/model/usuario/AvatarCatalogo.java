package com.sabia.auth.model.usuario;

import java.util.Arrays;

/** Catálogo fixo de avatares do aluno. O front exibe as imagens; o backend só aceita estes ids. */
public enum AvatarCatalogo {
    SABIA_AZUL("sabia-azul"),
    SABIA_LARANJA("sabia-laranja"),
    SABIA_VERDE("sabia-verde"),
    SABIA_AMARELO("sabia-amarelo"),
    SABIA_ROXO("sabia-roxo"),
    SABIA_ROSA("sabia-rosa"),
    SABIA_VERMELHO("sabia-vermelho"),
    SABIA_TURQUESA("sabia-turquesa");

    private final String id;

    AvatarCatalogo(String id) {
        this.id = id;
    }

    public String id() {
        return id;
    }

    public static boolean contem(String id) {
        return Arrays.stream(values()).anyMatch(a -> a.id.equals(id));
    }
}
