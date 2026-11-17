package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.service.pratica.StatusPratica;

import java.math.BigDecimal;

/**
 * Métricas e pseudocódigo do programa do aluno no Jogo do Robô, para o relatório de correção por IA.
 * Calculado sob demanda (nada é persistido). Definições em fixtures/robo/README.md, seção
 * "Análise para o relatório".
 */
public record AnaliseRobo(
        StatusPratica status,
        boolean concluida,
        int blocosUsados,
        int totalBlocosWorkspace,
        Integer maxBlocos,
        int blocosSoltos,
        boolean excedeuLimiteBlocos,
        boolean usouBlocoNaoPermitido,
        int passosExecutados,
        /** Menor número de passos do início ao destino (BFS); nulo se o cenário não tem caminho. */
        Integer passosMinimos,
        /** passosMinimos / passosExecutados (2 casas), só quando chegou; senão nulo. */
        BigDecimal eficiencia,
        int quantidadeRepetir,
        int profundidadeMaxima,
        int maiorSequenciaIgual,
        boolean sequenciaRepetivel,
        /** Distância Manhattan da posição final ao destino; nula sem posição final. */
        Integer distanciaAoDestino,
        String pseudocodigo,
        boolean pseudocodigoTruncado
) {}
