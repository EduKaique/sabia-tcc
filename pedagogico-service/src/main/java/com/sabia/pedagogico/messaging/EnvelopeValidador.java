package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

final class EnvelopeValidador {

    private EnvelopeValidador() {}

    /** Valida o envelope (mensagem malformada vai direto para a DLQ, sem retry) e abre o MDC. */
    static AutoCloseable abrirContexto(EnvelopeEvento<?> evento) {
        if (evento == null || evento.messageId() == null || evento.messageId().isBlank()
                || evento.payload() == null) {
            throw invalido("envelope sem messageId ou payload");
        }
        return ContextoLog.abrir(evento.messageId(), evento.correlationId(), evento.eventType());
    }

    static AmqpRejectAndDontRequeueException invalido(String motivo) {
        return new AmqpRejectAndDontRequeueException("Mensagem inválida: " + motivo);
    }
}
