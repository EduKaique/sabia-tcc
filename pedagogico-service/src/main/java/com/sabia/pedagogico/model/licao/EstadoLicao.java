package com.sabia.pedagogico.model.licao;

/** Estado calculado da lição (não é coluna): INATIVA = arquivada; senão, publicada_em decide. */
public enum EstadoLicao {
    RASCUNHO, PUBLICADA, ARQUIVADA;

    public static EstadoLicao de(Licao licao) {
        if (licao.getStatus() == StatusLicao.INATIVA) return ARQUIVADA;
        return licao.getPublicadaEm() != null ? PUBLICADA : RASCUNHO;
    }
}
