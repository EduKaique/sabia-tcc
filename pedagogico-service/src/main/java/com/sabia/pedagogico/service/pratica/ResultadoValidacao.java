package com.sabia.pedagogico.service.pratica;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.service.CenarioRoboValidador.Posicao;

/**
 * Resultado da validação da prática no servidor (fixtures/blocos-livres/README.md). Gravado em
 * submissao_avaliativa.validacao_json e devolvido na conclusão da lição. Sem replay de passos.
 */
public record ResultadoValidacao(
        int versaoValidador,
        ModoPratica modo,
        boolean concluida,
        StatusPratica status,
        int blocosUsados,
        int totalBlocosWorkspace,
        Integer maxBlocos,
        boolean excedeuLimiteBlocos,
        boolean usouBlocoNaoPermitido,
        int passosExecutados,
        int blocosSoltos,
        Posicao posicaoFinal,
        String motivo
) {
    public static final int VERSAO_VALIDADOR = 1;
}
