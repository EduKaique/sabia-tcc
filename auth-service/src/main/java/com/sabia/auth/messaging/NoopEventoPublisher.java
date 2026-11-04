package com.sabia.auth.messaging;

public class NoopEventoPublisher implements EventoPublisher {

    @Override
    public void publicar(String routingKey, Object payload) {
        // RabbitMQ desabilitado (sabia.mensageria.rabbitmq-enabled=false).
    }
}
