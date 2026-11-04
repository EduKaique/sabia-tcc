package com.sabia.pedagogico.messaging.contrato;

import java.time.Instant;

/**
 * Envelope comum de todos os eventos de integração do Sabiá. O {@code payload} é um contrato
 * próprio de cada evento, nunca uma entidade de domínio. Mudanças incompatíveis exigem nova
 * {@code version}.
 */
public record EnvelopeEvento<T>(
        String messageId,
        String eventType,
        int version,
        Instant occurredAt,
        String correlationId,
        String producer,
        T payload
) {}
