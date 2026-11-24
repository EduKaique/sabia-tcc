package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicao;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.TipoPagina;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GET /api/professor/licoes/{id}/progresso: progresso dos alunos das turmas vinculadas a uma lição, agrupado por
 * turma. {@code alunos[i].paginas[j]} corresponde a {@code paginas[j]}. Sem e-mail, CPF ou matrícula.
 * {@code totalAlunos} e {@code concluiram} contam alunos distintos (um aluno pode estar em duas turmas).
 */
public record ProgressoLicaoProfessorResponse(
        LicaoInfo licao,
        List<PaginaInfo> paginas,
        int totalAlunos,
        int concluiram,
        List<TurmaProgresso> turmas
) {
    public record LicaoInfo(Long id, String titulo, String conceito, ModoAtividade modo, EstadoLicao estado,
                            LocalDateTime publicadaEm) {}

    public record PaginaInfo(Long id, int ordem, TipoPagina tipo, String titulo) {}

    public record TurmaProgresso(Long turmaId, String turmaNome, List<AlunoProgresso> alunos) {}

    /** {@code melhorPercentualQuestionario}: média inteira dos melhores percentuais tentados; nulo sem tentativa. */
    public record AlunoProgresso(
            Long alunoId,
            String nome,
            EstadoLicaoAluno estado,
            int paginasConcluidas,
            Integer melhorPercentualQuestionario,
            boolean atividadeConcluida,
            LocalDateTime concluidaEm,
            List<PaginaAluno> paginas
    ) {}

    /** {@code melhorPercentual} e {@code tentativas}: só em questionário já tentado; nulos nos demais casos. */
    public record PaginaAluno(Long paginaId, boolean concluida, Integer melhorPercentual, Integer tentativas) {}
}
