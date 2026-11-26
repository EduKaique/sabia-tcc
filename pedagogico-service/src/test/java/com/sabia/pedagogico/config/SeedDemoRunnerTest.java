package com.sabia.pedagogico.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SeedDemoRunnerTest {

    private DriverManagerDataSource ds;
    private JdbcTemplate jdbc;

    @BeforeEach
    void criarBanco() {
        ds = new DriverManagerDataSource(
                "jdbc:h2:mem:seed" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new JdbcTemplate(ds);
        jdbc.execute("CREATE TABLE item (id BIGINT PRIMARY KEY, texto VARCHAR(500))");
    }

    private SeedDemoRunner runner(String sql) {
        return new SeedDemoRunner(ds, new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)));
    }

    private static String insert(long id, String texto) {
        return "INSERT INTO item (id, texto) SELECT " + id + ", '" + texto + "' WHERE NOT EXISTS "
                + "(SELECT 1 FROM item WHERE id = " + id + ")\n@@FIM@@\n";
    }

    @Test
    void pontoEVirgulaEmHtmlEJsonNaoQuebraOScript() throws Exception {
        String html = "<p>a&nbsp;b; c</p>";
        String json = "{\"a\":\"x;y\",\"b\":[1;2]}".replace("[1;2]", "[1,2]");
        runner(insert(9_000_001, html) + insert(9_000_002, json.replace("'", "''"))).run(null);

        assertThat(jdbc.queryForObject("SELECT texto FROM item WHERE id = 9000001", String.class)).isEqualTo(html);
        assertThat(jdbc.queryForObject("SELECT texto FROM item WHERE id = 9000002", String.class)).isEqualTo(json);
    }

    @Test
    void rodarVariasVezesNaoDuplica() throws Exception {
        SeedDemoRunner r = runner(insert(9_000_001, "a") + insert(9_000_002, "b"));
        r.run(null);
        r.run(null);
        r.run(null);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM item", Integer.class)).isEqualTo(2);
    }

    @Test
    void naoAlteraLinhaExistente() throws Exception {
        jdbc.update("INSERT INTO item VALUES (9000001, 'real')");
        runner(insert(9_000_001, "demo")).run(null);

        assertThat(jdbc.queryForObject("SELECT texto FROM item WHERE id = 9000001", String.class)).isEqualTo("real");
    }

    @Test
    void erroDesfazTudoEPropaga() {
        SeedDemoRunner r = runner(insert(9_000_001, "a") + "INSERT INTO tabela_inexistente VALUES (1)\n@@FIM@@\n");

        assertThatThrownBy(() -> r.run(null)).isInstanceOf(RuntimeException.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM item", Integer.class)).isZero();
    }
}
