package com.sabia.auth.config;

import com.sabia.auth.messaging.EventoPublisher;
import com.sabia.auth.messaging.NoopEventoPublisher;
import com.sabia.auth.messaging.RabbitEventoPublisher;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import lombok.extern.slf4j.Slf4j;

import static com.sabia.auth.messaging.MensageriaTopologia.EXCHANGE;

/** Auth apenas publica eventos de integração; declara só o exchange topic compartilhado. */
@Slf4j
@Configuration
public class RabbitMQConfig {

    @Bean
    @ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "false")
    public EventoPublisher eventoPublisherDesligado() {
        return new NoopEventoPublisher();
    }

    @Configuration
    @ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "true", matchIfMissing = true)
    static class Habilitada {

        @Bean
        EventoPublisher eventoPublisher(RabbitTemplate rabbitTemplate) {
            return new RabbitEventoPublisher(rabbitTemplate);
        }

        @Bean
        TopicExchange eventosExchange() {
            return new TopicExchange(EXCHANGE, true, false);
        }

        @Bean
        MessageConverter messageConverter() {
            return new JacksonJsonMessageConverter();
        }

        @Bean
        ApplicationRunner declararTopologiaRabbit(AmqpAdmin amqpAdmin) {
            return args -> {
                try {
                    amqpAdmin.initialize();
                    log.info("Exchange RabbitMQ {} declarado", EXCHANGE);
                } catch (Exception e) {
                    log.warn("RabbitMQ indisponível no startup; exchange será declarado na reconexão: {}",
                            e.getMessage());
                }
            };
        }
    }
}
