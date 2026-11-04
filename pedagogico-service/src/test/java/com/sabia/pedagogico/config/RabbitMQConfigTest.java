package com.sabia.pedagogico.config;

import com.sabia.pedagogico.messaging.EventoPublisher;
import com.sabia.pedagogico.messaging.NoopEventoPublisher;
import com.sabia.pedagogico.messaging.RabbitEventoPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMQConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(RabbitAutoConfiguration.class))
            .withUserConfiguration(RabbitMQConfig.class);

    @Test
    void desligadoNaoDeclaraTopologiaNemPublicaEventos() {
        contextRunner.withPropertyValues("sabia.mensageria.rabbitmq-enabled=false").run(ctx -> {
            assertThat(ctx).hasNotFailed();
            assertThat(ctx).doesNotHaveBean(Queue.class);
            assertThat(ctx).doesNotHaveBean(Exchange.class);
            assertThat(ctx).doesNotHaveBean(Binding.class);
            assertThat(ctx).doesNotHaveBean("declararTopologiaRabbit");
            assertThat(ctx.getBean(EventoPublisher.class)).isInstanceOf(NoopEventoPublisher.class);
        });
    }

    @Test
    void ligadoPorPadraoDeclaraFilasComDlqEBindings() {
        contextRunner.run(ctx -> {
            assertThat(ctx).hasNotFailed();
            assertThat(ctx.getBeansOfType(Queue.class)).hasSize(4);
            assertThat(ctx.getBeansOfType(Exchange.class)).hasSize(2);
            assertThat(ctx.getBeansOfType(Binding.class)).hasSize(4);
            assertThat(ctx).hasBean("declararTopologiaRabbit");
            assertThat(ctx).hasSingleBean(ConnectionFactory.class);
            assertThat(ctx.getBean(EventoPublisher.class)).isInstanceOf(RabbitEventoPublisher.class);

            Queue fila = ctx.getBean("alunoPerfilQueue", Queue.class);
            assertThat(fila.isDurable()).isTrue();
            assertThat(fila.getArguments())
                    .containsEntry("x-dead-letter-exchange", "sabia.eventos.dlx")
                    .containsEntry("x-dead-letter-routing-key", "pedagogico.aluno-perfil.queue.dlq");
        });
    }
}
