package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.AvaliarSubmissaoRequest;
import com.sabia.pedagogico.exception.NotaInvalidaException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.mapper.CorrecaoMapper;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.Correcao;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.CorrecaoRepository;
import com.sabia.pedagogico.repository.ProjetoAvaliativoRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubmissaoAvaliativaServiceCorrecaoTest {

    private final SubmissaoAvaliativaRepository submissaoRepo = mock(SubmissaoAvaliativaRepository.class);
    private final CorrecaoRepository correcaoRepo = mock(CorrecaoRepository.class);
    private final SubmissaoAvaliativaService service = new SubmissaoAvaliativaService(
            submissaoRepo, correcaoRepo, mock(AtividadeAvaliativaRepository.class),
            mock(ProjetoAvaliativoRepository.class), mock(TurmaAlunoRepository.class),
            mock(CorrecaoMapper.class), mock(ApplicationEventPublisher.class), mock(ValidadorPratica.class),
            JsonMapper.builder().build());
    private final SubmissaoAvaliativa submissao = new SubmissaoAvaliativa();

    SubmissaoAvaliativaServiceCorrecaoTest() {
        var turma = new Turma();
        turma.setProfessorId(5L);
        var atividade = new AtividadeAvaliativa();
        atividade.setId(10L);
        atividade.setTurma(turma);
        atividade.setPontuacaoMaxima(10);
        submissao.setAtividade(atividade);
        when(submissaoRepo.findById(1L)).thenReturn(Optional.of(submissao));
        when(correcaoRepo.save(any(Correcao.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static AvaliarSubmissaoRequest nota(String valor) {
        return new AvaliarSubmissaoRequest(new BigDecimal(valor), "Bom trabalho.");
    }

    @Test
    void notaIgualAoMaximoEhAceita() {
        var resposta = service.corrigir(5L, 1L, nota("10.00"));
        assertThat(resposta.status()).isEqualTo(StatusSubmissao.CORRIGIDA);
        verify(correcaoRepo).save(any(Correcao.class));
    }

    @Test
    void notaZeroEhAceita() {
        service.corrigir(5L, 1L, nota("0"));
        verify(correcaoRepo).save(any(Correcao.class));
    }

    @Test
    void notaAcimaDoMaximoEhRecusadaSemGravar() {
        assertThatThrownBy(() -> service.corrigir(5L, 1L, nota("10.01")))
                .isInstanceOf(NotaInvalidaException.class)
                .hasMessage("A nota deve ficar entre 0 e 10.");
        verify(correcaoRepo, never()).save(any());
        assertThat(submissao.getStatus()).isEqualTo(StatusSubmissao.PENDENTE);
    }

    @Test
    void submissaoJaAvaliadaContinuaComoOperacaoInvalida() {
        submissao.setCorrecao(new Correcao());
        assertThatThrownBy(() -> service.corrigir(5L, 1L, nota("50")))
                .isInstanceOf(OperacaoInvalidaException.class);
    }
}
