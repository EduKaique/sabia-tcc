package com.sabia.auth.messaging;

import org.slf4j.MDC;

/** Chaves de MDC que entram em todos os logs (inclusive no formato JSON estruturado). */
public final class ContextoLog {

    public static final String MESSAGE_ID = "messageId";
    public static final String CORRELATION_ID = "correlationId";
    public static final String EVENT_TYPE = "eventType";

    private ContextoLog() {}

    public static AutoCloseable abrir(String messageId, String correlationId, String eventType) {
        MDC.put(MESSAGE_ID, String.valueOf(messageId));
        MDC.put(CORRELATION_ID, String.valueOf(correlationId));
        MDC.put(EVENT_TYPE, String.valueOf(eventType));
        return () -> {
            MDC.remove(MESSAGE_ID);
            MDC.remove(CORRELATION_ID);
            MDC.remove(EVENT_TYPE);
        };
    }
}
