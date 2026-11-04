package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.RelatorioIaRequest;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RelatorioIaSubmissaoServiceTest {

    private final SubmissaoAvaliativaRepository repo = mock(SubmissaoAvaliativaRepository.class);
    private final RelatorioIaSubmissaoService service = new RelatorioIaSubmissaoService(repo, JsonMapper.builder().build());
    private final SubmissaoAvaliativa submissao = new SubmissaoAvaliativa();

    RelatorioIaSubmissaoServiceTest() {
        var turma = new Turma();
        turma.setProfessorId(5L);
        var atividade = new AtividadeAvaliativa();
        atividade.setTurma(turma);
        submissao.setAtividade(atividade);
        when(repo.findById(1L)).thenReturn(Optional.of(submissao));
    }

    private static RelatorioIaRequest relatorio() {
        return new RelatorioIaRequest("ok", new BigDecimal("7.5"), List.of("a"),
                List.of(new RelatorioIaRequest.Erro("e", "ALTA")));
    }

    @Test
    void salvaBuscaERemove() {
        assertThatThrownBy(() -> service.buscar(5L, 1L)).isInstanceOf(ResourceNotFoundException.class);

        service.salvar(5L, 1L, relatorio());
        assertThat(submissao.getRelatorioIaPreGeradoJson()).contains("\"resumo\":\"ok\"");

        var lido = service.buscar(5L, 1L);
        assertThat(lido.notaSugerida()).isEqualByComparingTo("7.5");
        assertThat(lido.erros()).extracting("descricao").containsExactly("e");

        service.remover(5L, 1L);
        assertThat(submissao.getRelatorioIaPreGeradoJson()).isNull();
    }

    @Test
    void professorDeOutraTurmaNaoAcessa() {
        assertThatThrownBy(() -> service.salvar(99L, 1L, relatorio())).isInstanceOf(AcessoNegadoException.class);
    }
}
