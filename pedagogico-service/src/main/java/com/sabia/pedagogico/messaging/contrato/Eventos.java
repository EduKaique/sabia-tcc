package com.sabia.pedagogico.messaging.contrato;

import java.math.BigDecimal;
import java.util.List;

/** Routing keys e contratos (payloads) dos eventos trocados pelo pedagógico. */
public final class Eventos {

    public static final String ALUNO_PERFIL_ATUALIZADO = "aluno.perfil-atualizado";
    public static final String SUBMISSAO_ENVIADA = "submissao.enviada";
    public static final String REVISAO_IA_GERADA = "submissao.revisao-ia.gerada";

    private Eventos() {}

    /** Publicado pelo auth-service. */
    public record AlunoPerfilAtualizado(Long alunoId, String nomeCompleto) {}

    /** Publicado pelo pedagógico; consumido pelo ia-service. Autossuficiente: a IA não chama de volta. */
    public record SubmissaoEnviada(
            Long submissaoId,
            Long atividadeId,
            Long alunoId,
            Atividade atividade,
            String estadoJson
    ) {
        public record Atividade(String titulo, String descricao, BigDecimal pontuacaoMaxima,
                                String gabaritoEstadoJson) {}
    }

    /** Publicado pelo ia-service; mesmo formato do relatório de {@code POST /submissao/revisar}. */
    public record RevisaoIaGerada(
            Long submissaoId,
            String resumo,
            BigDecimal notaSugerida,
            List<String> acertos,
            List<Erro> erros
    ) {
        public record Erro(String descricao, String severidade) {}
    }
}
