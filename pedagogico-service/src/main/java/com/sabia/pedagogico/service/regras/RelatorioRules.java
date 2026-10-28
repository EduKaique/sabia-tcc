package com.sabia.pedagogico.service.regras;

import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.atividade.Correcao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Objects;

@Component
public class RelatorioRules {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    public void validarPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio != null && dataFim != null && dataInicio.isAfter(dataFim)) {
            throw new OperacaoInvalidaException("A data inicial não pode ser posterior à data final.");
        }
    }

    public boolean dentroDoPeriodo(LocalDateTime data, LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio != null && data.toLocalDate().isBefore(dataInicio)) {
            return false;
        }
        return dataFim == null || !data.toLocalDate().isAfter(dataFim);
    }

    public BigDecimal taxa(long parte, long total) {
        if (total == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(parte)
                .multiply(CEM)
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal mediaNotas(Collection<SubmissaoAvaliativa> submissoes) {
        var notas = submissoes.stream()
                .map(SubmissaoAvaliativa::getCorrecao)
                .filter(Objects::nonNull)
                .map(Correcao::getNota)
                .toList();
        if (notas.isEmpty()) {
            return null;
        }
        return notas.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(notas.size()), 2, RoundingMode.HALF_UP);
    }

    public long totalAlunos(Collection<TurmaAluno> matriculas) {
        return matriculas.stream()
                .map(TurmaAluno::getAlunoId)
                .distinct()
                .count();
    }
}
