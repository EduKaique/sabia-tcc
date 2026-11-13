package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.Instant;
import java.util.UUID;

@Slf4j
public class RabbitEventoPublisher implements EventoPublisher {

    static final String PRODUTOR = "pedagogico-service";

    private final RabbitTemplate rabbitTemplate;

    public RabbitEventoPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        rabbitTemplate.setReturnsCallback(retorno -> log.warn(
                "Evento sem fila de destino (unroutable): messageId={} routingKey={} motivo={}",
                retorno.getMessage().getMessageProperties().getMessageId(),
                retorno.getRoutingKey(), retorno.getReplyText()));
    }

    @Override
    public void publicar(String routingKey, Object payload) {
        String messageId = UUID.randomUUID().toString();
        String correlationId = MDC.get(ContextoLog.CORRELATION_ID);
        if (correlationId == null) {
            correlationId = messageId;
        }
        var envelope = new EnvelopeEvento<>(messageId, routingKey, 1, Instant.now(),
                correlationId, PRODUTOR, payload);
        String correlacao = correlationId;
        try {
            var confirmacao = new CorrelationData(messageId);
            rabbitTemplate.convertAndSend(MensageriaTopologia.EXCHANGE, routingKey, envelope, mensagem -> {
                var props = mensagem.getMessageProperties();
                props.setMessageId(messageId);
                props.setCorrelationId(correlacao);
                props.setType(routingKey);
                props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                props.setHeader("x-producer", PRODUTOR);
                return mensagem;
            }, confirmacao);
            confirmacao.getFuture().whenComplete((conf, erro) -> {
                if (erro != null || conf == null || !conf.isAck()) {
                    log.error("Broker não confirmou o evento: messageId={} eventType={} motivo={}",
                            messageId, routingKey, erro != null ? erro.getMessage() : conf);
                }
            });
            log.info("Evento publicado: messageId={} eventType={} correlationId={}",
                    messageId, routingKey, correlacao);
        } catch (RuntimeException e) {
            log.error("Falha ao publicar evento: messageId={} eventType={} erro={}",
                    messageId, routingKey, e.getMessage());
        }
    }
}
