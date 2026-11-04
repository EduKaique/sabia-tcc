package com.sabia.auth.messaging;

public interface EventoPublisher {

    /** Publica um evento de integração; falhas de publicação são logadas e não propagadas. */
    void publicar(String routingKey, Object payload);
}
