package com.sabia.auth.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Carrega os dados de demonstração (seed-demo.sql) quando SABIA_SEED_DEMO=true. Roda depois do
 * Hibernate criar/atualizar as tabelas (ApplicationRunner) em qualquer perfil, inclusive prod, onde
 * o data.sql não executa. O script só pode ter INSERT idempotente: nunca UPDATE/DELETE.
 * O separador de comandos é "@@FIM@@" (e não ";") porque HTML e JSON do seed têm ponto e vírgula.
 * Tudo roda numa transação: falhou, nada entra e a aplicação não sobe.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(name = "sabia.seed.demo", havingValue = "true")
@Slf4j
public class SeedDemoRunner implements ApplicationRunner {

    static final String SEPARADOR = "@@FIM@@";

    private final DataSource dataSource;
    private final Resource script;

    public SeedDemoRunner(DataSource dataSource, @Value("classpath:seed-demo.sql") Resource script) {
        this.dataSource = dataSource;
        this.script = script;
    }

    @Override
    public void run(ApplicationArguments args) throws SQLException {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(false, false, "UTF-8", script);
        populator.setSeparator(SEPARADOR);
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                populator.populate(conn);
                conn.commit();
            } catch (RuntimeException | SQLException e) {
                conn.rollback();
                throw e;
            }
        }
        log.info("Seed de demonstração aplicado (SABIA_SEED_DEMO=true).");
    }
}
