package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Painel de progresso das lições de uma turma (professor). As células de cada aluno vêm na mesma ordem de
 * {@code licoes}: {@code alunos[i].celulas[j]} corresponde a {@code licoes[j]}. Sem e-mail, CPF ou matrícula.
 */
public record ProgressoLicoesTurmaResponse(
        Long turmaId,
        String turmaNome,
        int totalAlunos,
        List<LicaoColuna> licoes,
        List<AlunoLinha> alunos
) {
    /** {@code concluiram}: alunos matriculados com a lição concluída. */
    public record LicaoColuna(
            Long id,
            String titulo,
            String conceito,
            ModoAtividade modo,
            int totalPaginas,
            LocalDateTime publicadaEm,
            int concluiram
    ) {}

    public record AlunoLinha(Long alunoId, String nome, List<Celula> celulas) {}

    /** {@code melhorPercentualQuestionario}: média inteira dos melhores percentuais tentados; nulo sem tentativa. */
    public record Celula(
            Long licaoId,
            EstadoLicaoAluno estado,
            int paginasConcluidas,
            Integer melhorPercentualQuestionario,
            boolean atividadeConcluida,
            LocalDateTime concluidaEm
    ) {}
}
