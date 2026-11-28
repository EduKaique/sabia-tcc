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
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Carrega os dados de demonstração (seed-demo.sql) quando SABIA_SEED_DEMO=true. Roda depois do
 * Hibernate criar/atualizar as tabelas (ApplicationRunner) em qualquer perfil, inclusive prod, onde
 * o data.sql não executa. O script só pode ter INSERT idempotente: nunca UPDATE/DELETE.
 * O separador de comandos é "@@FIM@@" (e não ";") porque HTML e JSON do seed têm ponto e vírgula.
 * Tudo roda numa transação: se falhar, há rollback, o erro é registrado (SEED_DEMO_FALHOU) e o serviço sobe.
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
    public void run(ApplicationArguments args) {
        try {
            if (semComandos()) {
                log.info("Seed de demonstração ligado, mas o script não tem comandos: nada a fazer.");
                return;
            }
            aplicar();
            log.info("Seed de demonstração aplicado (SABIA_SEED_DEMO=true).");
        } catch (Exception e) {
            // Seed é opcional: falhar não pode derrubar o serviço (nada foi gravado, houve rollback).
            log.error("SEED_DEMO_FALHOU: seed de demonstração NÃO aplicado, nada foi gravado; o serviço segue no ar. "
                    + "Para desligar: SABIA_SEED_DEMO=false. Causa: {}", causaRaiz(e), e);
        }
    }

    private void aplicar() throws SQLException {
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
    }

    private static String causaRaiz(Throwable e) {
        Throwable t = e;
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return t.getMessage();
    }

    /** Script só com comentários ou vazio faz o populator lançar exceção; aqui vira "nada a fazer". */
    private boolean semComandos() throws IOException {
        String sql = script.getContentAsString(StandardCharsets.UTF_8)
                .replaceAll("(?s)/\\*.*?\\*/", "")
                .replaceAll("(?m)--.*$", "")
                .replace(SEPARADOR, "");
        return sql.isBlank();
    }
}
