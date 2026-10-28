package com.sabia.pedagogico.service.regras;

import com.sabia.pedagogico.dto.response.FaixaNotaResponse;
import com.sabia.pedagogico.dto.response.MediaAtividadeResponse;
import com.sabia.pedagogico.dto.response.ProgressaoTurmaResponse;
import com.sabia.pedagogico.dto.response.StatusEntregasResponse;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/** Análises estatísticas de uma turma. Funções puras: recebem dados já carregados. */
@Component
@RequiredArgsConstructor
public class RelatorioTurmaRules {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);
    private static final String[] FAIXAS = {"0-20", "20-40", "40-60", "60-80", "80-100"};

    private final RelatorioRules relatorioRules;

    /** Nota da correção como % da pontuação máxima da atividade; null se não corrigida. */
    public BigDecimal percentualDaNota(SubmissaoAvaliativa submissao) {
        var correcao = submissao.getCorrecao();
        int maxima = submissao.getAtividade().getPontuacaoMaxima();
        if (correcao == null || maxima <= 0) {
            return null;
        }
        return correcao.getNota().multiply(CEM).divide(BigDecimal.valueOf(maxima), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal media(Collection<BigDecimal> valores) {
        if (valores.isEmpty()) {
            return null;
        }
        return valores.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(valores.size()), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal mediana(Collection<BigDecimal> valores) {
        if (valores.isEmpty()) {
            return null;
        }
        var ordenados = valores.stream().sorted().toList();
        int meio = ordenados.size() / 2;
        if (ordenados.size() % 2 == 1) {
            return ordenados.get(meio).setScale(2, RoundingMode.HALF_UP);
        }
        return ordenados.get(meio - 1).add(ordenados.get(meio))
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
    }

    public List<BigDecimal> percentuaisCorrigidos(Collection<SubmissaoAvaliativa> submissoes) {
        return submissoes.stream()
                .map(this::percentualDaNota)
                .filter(Objects::nonNull)
                .toList();
    }

    /** Histograma em 5 faixas de 20 pontos percentuais; 100% entra na última faixa. */
    public List<FaixaNotaResponse> distribuir(Collection<BigDecimal> percentuais) {
        long[] contagem = new long[FAIXAS.length];
        for (var p : percentuais) {
            int indice = Math.min(FAIXAS.length - 1, Math.max(0, p.intValue() / 20));
            contagem[indice]++;
        }
        var faixas = new ArrayList<FaixaNotaResponse>();
        for (int i = 0; i < FAIXAS.length; i++) {
            faixas.add(new FaixaNotaResponse(FAIXAS[i], contagem[i]));
        }
        return faixas;
    }

    public List<MediaAtividadeResponse> mediasPorAtividade(
            List<AtividadeAvaliativa> atividades,
            long totalAlunos,
            Collection<SubmissaoAvaliativa> submissoes) {
        var porAtividade = submissoes.stream()
                .collect(Collectors.groupingBy(s -> s.getAtividade().getId()));
        return atividades.stream().map(atividade -> {
            var entregas = porAtividade.getOrDefault(atividade.getId(), List.of());
            var corrigidas = entregas.stream().filter(s -> s.getCorrecao() != null).toList();
            var media = media(corrigidas.stream().map(s -> s.getCorrecao().getNota()).toList());
            var mediaPercentual = atividade.getPontuacaoMaxima() > 0 && media != null
                    ? media.multiply(CEM).divide(BigDecimal.valueOf(atividade.getPontuacaoMaxima()), 2, RoundingMode.HALF_UP)
                    : null;
            return new MediaAtividadeResponse(
                    atividade.getId(),
                    atividade.getTitulo(),
                    atividade.getPontuacaoMaxima(),
                    media,
                    mediaPercentual,
                    entregas.size(),
                    corrigidas.size(),
                    totalAlunos,
                    relatorioRules.taxa(entregas.size(), totalAlunos)
            );
        }).toList();
    }

    public StatusEntregasResponse statusEntregas(
            long totalAlunos,
            long totalAtividades,
            Collection<SubmissaoAvaliativa> submissoes) {
        long esperado = totalAlunos * totalAtividades;
        long pendentes = contar(submissoes, StatusSubmissao.PENDENTE);
        long emCorrecao = contar(submissoes, StatusSubmissao.EM_CORRECAO);
        long corrigidas = contar(submissoes, StatusSubmissao.CORRIGIDA);
        long comAtraso = submissoes.stream().filter(this::entregueComAtraso).count();
        return new StatusEntregasResponse(
                esperado,
                Math.max(0, esperado - submissoes.size()),
                pendentes,
                emCorrecao,
                corrigidas,
                submissoes.size() - comAtraso,
                comAtraso
        );
    }

    public ProgressaoTurmaResponse progressao(
            List<AtividadeAvaliativa> atividades,
            Collection<TurmaAluno> matriculas,
            Collection<SubmissaoAvaliativa> submissoes) {
        Map<String, BigDecimal> notas = new HashMap<>();
        for (var submissao : submissoes) {
            var percentual = percentualDaNota(submissao);
            if (percentual != null) {
                notas.put(submissao.getAlunoId() + ":" + submissao.getAtividade().getId(), percentual);
            }
        }

        var alunos = matriculas.stream()
                .sorted(Comparator.comparing(m -> nomeDe(m).toLowerCase()))
                .map(m -> {
                    var serie = atividades.stream()
                            .map(a -> notas.get(m.getAlunoId() + ":" + a.getId()))
                            .toList();
                    var media = media(serie.stream().filter(Objects::nonNull).toList());
                    return new ProgressaoTurmaResponse.ProgressaoAluno(m.getAlunoId(), nomeDe(m), media, serie);
                })
                .toList();

        var mediaTurma = new ArrayList<BigDecimal>();
        for (int i = 0; i < atividades.size(); i++) {
            int indice = i;
            mediaTurma.add(media(alunos.stream()
                    .map(a -> a.notasPercentuais().get(indice))
                    .filter(Objects::nonNull)
                    .toList()));
        }

        var refs = atividades.stream()
                .map(a -> new ProgressaoTurmaResponse.AtividadeRef(a.getId(), a.getTitulo()))
                .toList();
        return new ProgressaoTurmaResponse(refs, alunos, mediaTurma);
    }

    private long contar(Collection<SubmissaoAvaliativa> submissoes, StatusSubmissao status) {
        return submissoes.stream().filter(s -> s.getStatus() == status).count();
    }

    private boolean entregueComAtraso(SubmissaoAvaliativa submissao) {
        var prazo = submissao.getAtividade().getDataEntrega();
        return prazo != null && submissao.getDataEnvio().isAfter(prazo);
    }

    private String nomeDe(TurmaAluno matricula) {
        var nome = matricula.getAlunoNome();
        return nome == null || nome.isBlank() ? "Aluno #" + matricula.getAlunoId() : nome;
    }
}
