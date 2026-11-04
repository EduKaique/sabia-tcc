package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import com.sabia.pedagogico.messaging.contrato.Eventos;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumidoresTest {

    private final MensagemProcessadaRepository processadas = mock(MensagemProcessadaRepository.class);
    private final ProcessadorIdempotente processador = new ProcessadorIdempotente(processadas);
    private final TurmaAlunoRepository turmaAlunos = mock(TurmaAlunoRepository.class);
    private final SubmissaoAvaliativaRepository submissoes = mock(SubmissaoAvaliativaRepository.class);

    private static <T> EnvelopeEvento<T> envelope(String id, String tipo, T payload) {
        return new EnvelopeEvento<>(id, tipo, 1, Instant.now(), "corr-1", "teste", payload);
    }

    @Test
    void perfilAtualizadoAtualizaNomesEMarcaMensagemComoProcessada() throws Exception {
        var consumidor = new AlunoPerfilConsumidor(processador, turmaAlunos, submissoes);
        when(turmaAlunos.atualizarNomeAluno(7L, "Ana Souza")).thenReturn(2);

        consumidor.aoReceber(envelope("m-1", Eventos.ALUNO_PERFIL_ATUALIZADO,
                new Eventos.AlunoPerfilAtualizado(7L, "Ana Souza")));

        verify(turmaAlunos).atualizarNomeAluno(7L, "Ana Souza");
        verify(submissoes).atualizarNomeAluno(7L, "Ana Souza");
        verify(processadas).saveAndFlush(any(MensagemProcessada.class));
    }

    @Test
    void mensagemDuplicadaEhIgnorada() throws Exception {
        var consumidor = new AlunoPerfilConsumidor(processador, turmaAlunos, submissoes);
        when(processadas.existsById("pedagogico.aluno-perfil:m-1")).thenReturn(true);

        consumidor.aoReceber(envelope("m-1", Eventos.ALUNO_PERFIL_ATUALIZADO,
                new Eventos.AlunoPerfilAtualizado(7L, "Ana")));

        verifyNoInteractions(turmaAlunos, submissoes);
        verify(processadas, never()).saveAndFlush(any());
    }

    @Test
    void payloadInvalidoVaiDiretoParaDlqSemRetry() {
        var consumidor = new AlunoPerfilConsumidor(processador, turmaAlunos, submissoes);

        assertThatThrownBy(() -> consumidor.aoReceber(envelope("m-2", Eventos.ALUNO_PERFIL_ATUALIZADO,
                new Eventos.AlunoPerfilAtualizado(null, " "))))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class);
        assertThatThrownBy(() -> consumidor.aoReceber(null))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class);
        verifyNoInteractions(turmaAlunos, submissoes);
    }

    @Test
    void revisaoGeradaEhGravadaNaSubmissao() throws Exception {
        var consumidor = new RevisaoIaConsumidor(processador, submissoes, JsonMapper.builder().build());
        var submissao = new SubmissaoAvaliativa();
        when(submissoes.findById(10L)).thenReturn(Optional.of(submissao));

        consumidor.aoReceber(envelope("m-3", Eventos.REVISAO_IA_GERADA, new Eventos.RevisaoIaGerada(
                10L, "Bom trabalho", new BigDecimal("8.5"), List.of("Laço correto"),
                List.of(new Eventos.RevisaoIaGerada.Erro("Faltou imprimir", "media")))));

        assertThat(submissao.getRelatorioIaPreGeradoJson())
                .contains("\"resumo\":\"Bom trabalho\"")
                .contains("\"notaSugerida\":8.5")
                .contains("Faltou imprimir")
                .doesNotContain("submissaoId");
        verify(submissoes).save(submissao);
    }

    @Test
    void revisaoDeSubmissaoInexistenteFalhaParaAcionarRetryEDlq() {
        var consumidor = new RevisaoIaConsumidor(processador, submissoes, JsonMapper.builder().build());
        when(submissoes.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> consumidor.aoReceber(envelope("m-4", Eventos.REVISAO_IA_GERADA,
                new Eventos.RevisaoIaGerada(99L, null, null, List.of(), List.of()))))
                .isInstanceOf(RuntimeException.class)
                .isNotInstanceOf(AmqpRejectAndDontRequeueException.class);
    }
}
