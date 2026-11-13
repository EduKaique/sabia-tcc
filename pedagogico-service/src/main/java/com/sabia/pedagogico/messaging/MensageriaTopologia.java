package com.sabia.pedagogico.messaging;

/** Nomes de exchanges e filas do broker (a topologia é declarada em {@code RabbitMQConfig}). */
public final class MensageriaTopologia {

    public static final String EXCHANGE = "sabia.eventos";
    public static final String DLX = "sabia.eventos.dlx";

    public static final String FILA_ALUNO_PERFIL = "pedagogico.aluno-perfil.queue";
    public static final String FILA_REVISAO_IA = "pedagogico.revisao-ia.queue";
    public static final String FILA_SUBMISSAO_REVISAO = "ia.submissao-revisao.queue";

    private MensageriaTopologia() {}

    public static String dlq(String fila) {
        return fila + ".dlq";
    }
}
