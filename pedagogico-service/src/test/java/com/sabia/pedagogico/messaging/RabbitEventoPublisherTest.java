package com.sabia.pedagogico.messaging;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import com.sabia.pedagogico.messaging.contrato.Eventos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RabbitEventoPublisherTest {

    private final RabbitTemplate template = mock(RabbitTemplate.class);
    private final RabbitEventoPublisher publisher = new RabbitEventoPublisher(template);

    @Test
    void publicaEnvelopeComIdentificacaoNoExchangeDeEventos() throws Exception {
        publisher.publicar(Eventos.ALUNO_PERFIL_ATUALIZADO, new Eventos.AlunoPerfilAtualizado(7L, "Ana"));

        var envelope = ArgumentCaptor.forClass(Object.class);
        var post = ArgumentCaptor.forClass(MessagePostProcessor.class);
        var correlacao = ArgumentCaptor.forClass(CorrelationData.class);
        verify(template).convertAndSend(eq("sabia.eventos"), eq("aluno.perfil-atualizado"),
                envelope.capture(), post.capture(), correlacao.capture());

        @SuppressWarnings("unchecked")
        var e = (EnvelopeEvento<Eventos.AlunoPerfilAtualizado>) envelope.getValue();
        assertThat(e.messageId()).isNotBlank();
        assertThat(e.correlationId()).isEqualTo(e.messageId());
        assertThat(e.eventType()).isEqualTo("aluno.perfil-atualizado");
        assertThat(e.version()).isEqualTo(1);
        assertThat(e.producer()).isEqualTo("pedagogico-service");
        assertThat(e.payload().alunoId()).isEqualTo(7L);
        assertThat(correlacao.getValue().getId()).isEqualTo(e.messageId());

        Message mensagem = post.getValue().postProcessMessage(new Message(new byte[0], new MessageProperties()));
        assertThat(mensagem.getMessageProperties().getMessageId()).isEqualTo(e.messageId());
        assertThat(mensagem.getMessageProperties().getType()).isEqualTo("aluno.perfil-atualizado");
    }

    @Test
    void falhaDePublicacaoNaoPropagaParaORequest() {
        doThrow(new IllegalStateException("broker fora"))
                .when(template).convertAndSend(any(String.class), any(String.class), any(Object.class),
                        any(MessagePostProcessor.class), any(CorrelationData.class));

        publisher.publicar(Eventos.SUBMISSAO_ENVIADA, new Object());
    }
}
