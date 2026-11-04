package com.sabia.pedagogico.config;

import com.sabia.pedagogico.messaging.EventoPublisher;
import com.sabia.pedagogico.messaging.NoopEventoPublisher;
import com.sabia.pedagogico.messaging.RabbitEventoPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJacksonJavaTypeMapper;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.sabia.pedagogico.messaging.MensageriaTopologia.*;
import static com.sabia.pedagogico.messaging.contrato.Eventos.*;

/**
 * Topologia: exchange topic {@code sabia.eventos}; cada fila consumida tem uma DLQ ligada ao
 * DLX {@code sabia.eventos.dlx}. O pedagógico declara as filas que consome; a fila do ia-service
 * é declarada por ele (com argumentos idênticos).
 */
@Slf4j
@Configuration
public class RabbitMQConfig {

    @Bean
    @ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "true", matchIfMissing = true)
    public EventoPublisher eventoPublisher(RabbitTemplate rabbitTemplate) {
        return new RabbitEventoPublisher(rabbitTemplate);
    }

    @Bean
    @ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "false")
    public EventoPublisher eventoPublisherDesligado() {
        return new NoopEventoPublisher();
    }

    @Configuration
    @ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "true", matchIfMissing = true)
    static class Topologia {

        @Bean
        TopicExchange eventosExchange() {
            return new TopicExchange(EXCHANGE, true, false);
        }

        @Bean
        DirectExchange eventosDlx() {
            return new DirectExchange(DLX, true, false);
        }

        @Bean
        Queue alunoPerfilQueue() {
            return filaComDlq(FILA_ALUNO_PERFIL);
        }

        @Bean
        Queue alunoPerfilDlq() {
            return QueueBuilder.durable(dlq(FILA_ALUNO_PERFIL)).build();
        }

        @Bean
        Queue revisaoIaQueue() {
            return filaComDlq(FILA_REVISAO_IA);
        }

        @Bean
        Queue revisaoIaDlq() {
            return QueueBuilder.durable(dlq(FILA_REVISAO_IA)).build();
        }

        @Bean
        Binding alunoPerfilBinding(Queue alunoPerfilQueue, TopicExchange eventosExchange) {
            return BindingBuilder.bind(alunoPerfilQueue).to(eventosExchange).with(ALUNO_PERFIL_ATUALIZADO);
        }

        @Bean
        Binding revisaoIaBinding(Queue revisaoIaQueue, TopicExchange eventosExchange) {
            return BindingBuilder.bind(revisaoIaQueue).to(eventosExchange).with(REVISAO_IA_GERADA);
        }

        @Bean
        Binding alunoPerfilDlqBinding(Queue alunoPerfilDlq, DirectExchange eventosDlx) {
            return BindingBuilder.bind(alunoPerfilDlq).to(eventosDlx).with(dlq(FILA_ALUNO_PERFIL));
        }

        @Bean
        Binding revisaoIaDlqBinding(Queue revisaoIaDlq, DirectExchange eventosDlx) {
            return BindingBuilder.bind(revisaoIaDlq).to(eventosDlx).with(dlq(FILA_REVISAO_IA));
        }

        /** O consumidor não depende do {@code __TypeId__} do produtor: o tipo vem do método do listener. */
        @Bean
        MessageConverter messageConverter() {
            var converter = new JacksonJsonMessageConverter();
            converter.setTypePrecedence(DefaultJacksonJavaTypeMapper.TypePrecedence.INFERRED);
            return converter;
        }

        @Bean
        ApplicationRunner declararTopologiaRabbit(AmqpAdmin amqpAdmin) {
            return args -> {
                try {
                    amqpAdmin.initialize();
                    log.info("Topologia RabbitMQ declarada (exchange {}, filas e DLQs)", EXCHANGE);
                } catch (Exception e) {
                    log.warn("RabbitMQ indisponível no startup; topologia será declarada na reconexão: {}",
                            e.getMessage());
                }
            };
        }

        private static Queue filaComDlq(String nome) {
            return QueueBuilder.durable(nome)
                    .deadLetterExchange(DLX)
                    .deadLetterRoutingKey(dlq(nome))
                    .build();
        }
    }
}
