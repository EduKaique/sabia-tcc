package com.sabia.pedagogico.dto.response;

import java.util.List;

/**
 * POST .../paginas/{paginaId}/questionario. Diz SE cada pergunta está certa, nunca QUAL é a alternativa certa.
 * {@code aprovado} é desta tentativa; {@code aprovadoNaPagina}, o acumulado (nunca desfeito).
 */
public record CorrecaoQuestionarioResponse(
        Long paginaId,
        int acertos,
        int total,
        int percentual,
        boolean aprovado,
        boolean aprovadoNaPagina,
        int melhorPercentual,
        int tentativas,
        List<PerguntaCorrigida> perguntas,
        boolean praticaLiberada
) {
    public record PerguntaCorrigida(boolean certa) {}
}
