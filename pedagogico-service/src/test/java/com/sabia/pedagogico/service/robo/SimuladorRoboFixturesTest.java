package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.service.CenarioRoboValidador;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Casos compartilhados com o simulador TS (fixtures/robo na raiz do repositório, contrato em
 * fixtures/robo/README.md). Cada caso compara só as chaves presentes em "esperado".
 */
class SimuladorRoboFixturesTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private final SimuladorRobo simulador = new SimuladorRobo(new CenarioRoboValidador(JSON));

    /** Sobe a partir do diretório de trabalho até achar fixtures/robo (o Maven roda em pedagogico-service). */
    static Path pastaFixtures() {
        for (Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath(); dir != null; dir = dir.getParent()) {
            Path candidata = dir.resolve("fixtures").resolve("robo");
            if (Files.isDirectory(candidata)) {
                return candidata;
            }
        }
        return fail("Pasta fixtures/robo não encontrada a partir de " + System.getProperty("user.dir")
                + ". Rode os testes de dentro do repositório (no Docker, monte a raiz do repo, não só pedagogico-service).");
    }

    static Stream<Arguments> casos() throws IOException {
        try (Stream<Path> arquivos = Files.list(pastaFixtures())) {
            return arquivos.filter(p -> p.toString().endsWith(".json"))
                    .sorted()
                    .map(p -> {
                        try {
                            JsonNode caso = JSON.readTree(Files.readString(p));
                            return Arguments.of(caso.get("nome").stringValue(), caso);
                        } catch (IOException e) {
                            throw new IllegalStateException("Fixture ilegível: " + p.getFileName(), e);
                        }
                    })
                    .toList()
                    .stream();
        }
    }

    @Test
    void encontraOsCasosCompartilhados() throws IOException {
        assertThat(casos()).isNotEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("casos")
    void fixture(String nome, JsonNode caso) {
        JsonNode estado = caso.get("estado");
        String estadoJson = estado.isString() ? estado.stringValue() : estado.toString();

        ResultadoSimulacao resultado = simulador.simular(caso.get("cenario").toString(), estadoJson);

        JsonNode esperado = caso.get("esperado");
        if (esperado.has("status")) {
            assertThat(resultado.status().name()).as("status").isEqualTo(esperado.get("status").stringValue());
        }
        if (esperado.has("blocosUsados")) {
            assertThat(resultado.blocosUsados()).as("blocosUsados").isEqualTo(esperado.get("blocosUsados").intValue());
        }
        if (esperado.has("passosExecutados")) {
            assertThat(resultado.passosExecutados()).as("passosExecutados")
                    .isEqualTo(esperado.get("passosExecutados").intValue());
        }
        if (esperado.has("blocosSoltos")) {
            assertThat(resultado.blocosSoltos()).as("blocosSoltos").isEqualTo(esperado.get("blocosSoltos").intValue());
        }
        if (esperado.has("posicaoFinal")) {
            JsonNode pos = esperado.get("posicaoFinal");
            assertThat(resultado.posicaoFinal().linha()).as("posicaoFinal.linha").isEqualTo(pos.get("linha").intValue());
            assertThat(resultado.posicaoFinal().coluna()).as("posicaoFinal.coluna").isEqualTo(pos.get("coluna").intValue());
        }
    }
}
