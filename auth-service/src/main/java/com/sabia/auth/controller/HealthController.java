package com.sabia.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Verificação de saúde do serviço")
public class HealthController {

    private final ObjectProvider<ConnectionFactory> connectionFactory;
    private final boolean rabbitHabilitado;

    public HealthController(ObjectProvider<ConnectionFactory> connectionFactory,
                            @Value("${sabia.mensageria.rabbitmq-enabled:true}") boolean rabbitHabilitado) {
        this.connectionFactory = connectionFactory;
        this.rabbitHabilitado = rabbitHabilitado;
    }

    @GetMapping
    @Operation(summary = "Verifica se o serviço de autenticação está no ar")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString(),
                "service", "sabia-auth-service",
                "rabbitmq", statusRabbit()
        ));
    }

    /** O RabbitMQ degrada só a publicação de eventos; não derruba o status do serviço. */
    private String statusRabbit() {
        var factory = connectionFactory.getIfAvailable();
        if (!rabbitHabilitado || factory == null) {
            return "DISABLED";
        }
        try (var conexao = factory.createConnection()) {
            return conexao.isOpen() ? "UP" : "DOWN";
        } catch (Exception e) {
            return "DOWN";
        }
    }
}
