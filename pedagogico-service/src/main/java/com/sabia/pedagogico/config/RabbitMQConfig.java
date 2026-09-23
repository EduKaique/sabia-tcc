package com.sabia.pedagogico.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@EnableConfigurationProperties(MensageriaProperties.class)
public class RabbitMQConfig {

    @Bean
    public DirectExchange correcoesExchange(MensageriaProperties props) {
        return new DirectExchange(props.correcoes().exchange(), true, false);
    }

    @Bean
    public Queue correcoesQueue(MensageriaProperties props) {
        return QueueBuilder.durable(props.correcoes().fila()).build();
    }

    @Bean
    public Binding correcoesBinding(Queue correcoesQueue, DirectExchange correcoesExchange,
                                    MensageriaProperties props) {
        return BindingBuilder.bind(correcoesQueue)
                .to(correcoesExchange)
                .with(props.correcoes().routingKey());
    }

    @Bean
    public MessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter,
                                         MensageriaProperties props) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        template.setExchange(props.correcoes().exchange());
        return template;
    }

    @Bean
    public ApplicationRunner declararTopologiaRabbit(AmqpAdmin amqpAdmin) {
        return args -> {
            try {
                amqpAdmin.initialize();
                log.info("Topologia RabbitMQ declarada (exchange, fila e binding de correções)");
            } catch (Exception e) {
                log.warn("RabbitMQ indisponível no startup; topologia não declarada: {}", e.getMessage());
            }
        };
    }
}
