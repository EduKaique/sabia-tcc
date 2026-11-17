package com.sabia.pedagogico.service.pratica;

/** Status da validação: os do simulador do robô mais os de blocos livres. */
public enum StatusPratica {
    CHEGOU,
    NAO_CHEGOU,
    COLIDIU,
    SAIU_DO_GRID,
    SEM_BLOCOS,
    LIMITE_EXCEDIDO,
    BLOCOS_LIVRES_OK,
    BLOCOS_LIVRES_VAZIO
}
