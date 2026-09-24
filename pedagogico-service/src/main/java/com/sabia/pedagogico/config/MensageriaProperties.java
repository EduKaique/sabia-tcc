package com.sabia.pedagogico.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sabia.mensageria")
public record MensageriaProperties(Correcoes correcoes) {

    public record Correcoes(String exchange, String fila, String routingKey) {}
}
