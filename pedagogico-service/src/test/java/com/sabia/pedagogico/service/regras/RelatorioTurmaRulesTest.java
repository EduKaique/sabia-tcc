package com.sabia.pedagogico.service.regras;

import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.Correcao;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RelatorioTurmaRulesTest {

    private final RelatorioTurmaRules rules = new RelatorioTurmaRules(new RelatorioRules());

    private AtividadeAvaliativa atividade(long id, int maxima) {
        return AtividadeAvaliativa.builder().id(id).titulo("A" + id).pontuacaoMaxima(maxima)
                .criadaEm(LocalDateTime.now()).build();
    }

    private SubmissaoAvaliativa submissao(long alunoId, AtividadeAvaliativa atividade, String nota) {
        var s = SubmissaoAvaliativa.builder().alunoId(alunoId).atividade(atividade)
                .dataEnvio(LocalDateTime.now())
                .status(nota == null ? StatusSubmissao.PENDENTE : StatusSubmissao.CORRIGIDA).build();
        if (nota != null) {
            s.setCorrecao(Correcao.builder().nota(new BigDecimal(nota)).build());
        }
        return s;
    }

    @Test
    void normalizaNotaParaPercentualDaPontuacaoMaxima() {
        assertEquals(new BigDecimal("75.00"), rules.percentualDaNota(submissao(1, atividade(1, 20), "15")));
        assertNull(rules.percentualDaNota(submissao(1, atividade(1, 20), null)));
    }

    @Test
    void calculaMediaEMediana() {
        var valores = List.of(new BigDecimal("40"), new BigDecimal("60"), new BigDecimal("100"));
        assertEquals(new BigDecimal("66.67"), rules.media(valores));
        assertEquals(new BigDecimal("60.00"), rules.mediana(valores));
        assertEquals(new BigDecimal("50.00"), rules.mediana(List.of(new BigDecimal("40"), new BigDecimal("60"))));
        assertNull(rules.media(List.of()));
    }

    @Test
    void distribuiEmFaixasIncluindoCemNaUltima() {
        var faixas = rules.distribuir(List.of(
                new BigDecimal("0"), new BigDecimal("19.99"), new BigDecimal("20"), new BigDecimal("100")));
        assertEquals(2, faixas.get(0).quantidade());
        assertEquals(1, faixas.get(1).quantidade());
        assertEquals(1, faixas.get(4).quantidade());
    }

    @Test
    void progressaoAlinhaSeriesPorAtividade() {
        var a1 = atividade(1, 10);
        var a2 = atividade(2, 10);
        var alunos = List.of(
                TurmaAluno.builder().alunoId(1L).alunoNome("Ana").build(),
                TurmaAluno.builder().alunoId(2L).alunoNome("Bia").build());
        var submissoes = List.of(
                submissao(1, a1, "5"), submissao(1, a2, "10"), submissao(2, a1, "7"));

        var r = rules.progressao(List.of(a1, a2), alunos, submissoes);

        assertEquals(List.of(new BigDecimal("50.00"), new BigDecimal("100.00")), r.alunos().get(0).notasPercentuais());
        assertNull(r.alunos().get(1).notasPercentuais().get(1));
        assertEquals(new BigDecimal("60.00"), r.mediaTurma().get(0));
        assertEquals(new BigDecimal("100.00"), r.mediaTurma().get(1));
    }

    @Test
    void statusConsideraNaoEntregues() {
        var a = atividade(1, 10);
        var r = rules.statusEntregas(3, 1, List.of(submissao(1, a, "10"), submissao(2, a, null)));
        assertEquals(3, r.totalEsperado());
        assertEquals(1, r.naoEntregues());
        assertEquals(1, r.pendentes());
        assertEquals(1, r.corrigidas());
    }
}
