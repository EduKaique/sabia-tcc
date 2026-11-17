package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.service.CenarioRoboValidador.Posicao;

/** Resultado da simulação; campos definidos em fixtures/robo/README.md. */
public record ResultadoSimulacao(
        StatusSimulacao status,
        int blocosUsados,
        int passosExecutados,
        int blocosSoltos,
        Posicao posicaoFinal,
        int totalBlocosWorkspace
) {}
