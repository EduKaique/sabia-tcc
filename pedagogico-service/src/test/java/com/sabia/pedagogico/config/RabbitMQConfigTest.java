package com.sabia.pedagogico.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMQConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(RabbitAutoConfiguration.class))
            .withUserConfiguration(RabbitMQConfig.class)
            .withPropertyValues(
                    "sabia.mensageria.correcoes.exchange=ex",
                    "sabia.mensageria.correcoes.fila=fila",
                    "sabia.mensageria.correcoes.routing-key=rk");

    @Test
    void desligadoNaoDeclaraTopologiaNemRunner() {
        contextRunner.withPropertyValues("sabia.mensageria.rabbitmq-enabled=false").run(ctx -> {
            assertThat(ctx).hasNotFailed();
            assertThat(ctx).doesNotHaveBean(RabbitMQConfig.class);
            assertThat(ctx).doesNotHaveBean(Queue.class);
            assertThat(ctx).doesNotHaveBean(DirectExchange.class);
            assertThat(ctx).doesNotHaveBean(Binding.class);
            assertThat(ctx).doesNotHaveBean("declararTopologiaRabbit");
        });
    }

    @Test
    void ligadoPorPadraoMantemComportamentoAtual() {
        contextRunner.run(ctx -> {
            assertThat(ctx).hasNotFailed();
            assertThat(ctx).hasSingleBean(Queue.class);
            assertThat(ctx).hasSingleBean(DirectExchange.class);
            assertThat(ctx).hasSingleBean(Binding.class);
            assertThat(ctx).hasBean("declararTopologiaRabbit");
            assertThat(ctx).hasSingleBean(ConnectionFactory.class);
        });
    }
}
