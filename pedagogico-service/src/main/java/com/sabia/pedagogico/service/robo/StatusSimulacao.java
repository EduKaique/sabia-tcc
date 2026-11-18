package com.sabia.pedagogico.service.robo;

/** Mesmos nomes do StatusSimulacao do simulador TS (web/src/lib/simuladorRobo.ts). */
public enum StatusSimulacao {
    CHEGOU,
    NAO_CHEGOU,
    COLIDIU,
    SAIU_DO_GRID,
    SEM_BLOCOS,
    LIMITE_EXCEDIDO
}
