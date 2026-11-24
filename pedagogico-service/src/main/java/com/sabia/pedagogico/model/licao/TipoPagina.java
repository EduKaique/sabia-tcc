package com.sabia.pedagogico.model.licao;

/**
 * Tipos de página da lição. Todos os valores existem desde a criação da coluna: o Hibernate grava um CHECK
 * com a lista inicial, e o ddl-auto update não o refaz. VIDEO_UPLOAD ainda é recusado pela API.
 */
public enum TipoPagina {
    TEXTO, IMAGEM_TEXTO, VIDEO_YOUTUBE, VIDEO_UPLOAD, QUESTIONARIO
}
