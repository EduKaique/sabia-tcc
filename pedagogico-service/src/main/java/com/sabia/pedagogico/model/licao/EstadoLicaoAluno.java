package com.sabia.pedagogico.model.licao;

/**
 * Situação da lição para o aluno, calculada (sem coluna) a partir do progresso das páginas e da prática.
 * Regra em {@code service.licao.ProgressoLicaoRegras}.
 */
public enum EstadoLicaoAluno {
    NAO_INICIADA, EM_ANDAMENTO, PRATICA_LIBERADA, CONCLUIDA
}
