package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Casos específicos do Java, fora dos fixtures compartilhados. */
class SimuladorRoboTest {

    private static final String LIVRE_10X10 = "{\"versao\":1,\"linhas\":10,\"colunas\":10,"
            + "\"inicio\":{\"linha\":9,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":9},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}";

    private final SimuladorRobo simulador = new SimuladorRobo(new CenarioRoboValidador(JsonMapper.builder().build()));

    private static String workspace(String... topo) {
        return "{\"blocks\":{\"languageVersion\":0,\"blocks\":[" + String.join(",", topo) + "]}}";
    }

    private static String moverCima(String casasJson) {
        return "{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":" + casasJson + "}}";
    }

    @Test
    void totalBlocosWorkspaceContaTodasAsPilhasSemSombras() {
        String principal = "{\"type\":\"robo_repetir\",\"x\":0,\"y\":0,\"fields\":{\"VEZES\":2},"
                + "\"inputs\":{\"FAZER\":{\"block\":" + moverCima("1").replace("}}", "},\"next\":{\"block\":"
                + moverCima("1") + "}}") + "}}}";
        String soltoComSombra = "{\"type\":\"text_print\",\"x\":0,\"y\":300,"
                + "\"inputs\":{\"TEXT\":{\"shadow\":{\"type\":\"text\",\"fields\":{\"TEXT\":\"oi\"}}}},"
                + "\"next\":{\"block\":" + moverCima("1") + "}}";

        ResultadoSimulacao r = simulador.simular(LIVRE_10X10, workspace(principal, soltoComSombra));

        // repetir + 2 mover na principal; text_print + mover no solto; a sombra não conta.
        assertThat(r.totalBlocosWorkspace()).isEqualTo(5);
        assertThat(r.blocosUsados()).isEqualTo(3);
        assertThat(r.blocosSoltos()).isEqualTo(1);
    }

    @ParameterizedTest(name = "CASAS {0} -> {1} passos")
    @CsvSource(delimiter = ';', value = {
            "\"3\"; 3", "\" 4 \"; 4", "\"+2\"; 2", "\"2.7\"; 2", "\".5\"; 1", "\"5.\"; 5", "\"-3\"; 1",
            "6.99; 6", "1e30; 9", "\"1e1\"; 1", "\"0x10\"; 1", "\"Infinity\"; 1", "\"\"; 1", "\"abc\"; 1",
            "null; 1", "true; 1", "{}; 1", "[5]; 1"})
    void coercaoDeCasas(String casasJson, int passosEsperados) {
        ResultadoSimulacao r = simulador.simular(LIVRE_10X10, workspace(moverCima(casasJson)));
        assertThat(r.passosExecutados()).isEqualTo(passosEsperados);
    }

    @Test
    void estadoNuloOuVazioEhSemBlocos() {
        assertThat(simulador.simular(LIVRE_10X10, null).status()).isEqualTo(StatusSimulacao.SEM_BLOCOS);
        assertThat(simulador.simular(LIVRE_10X10, "").status()).isEqualTo(StatusSimulacao.SEM_BLOCOS);
        assertThat(simulador.simular(LIVRE_10X10, "null").status()).isEqualTo(StatusSimulacao.SEM_BLOCOS);
        assertThat(simulador.simular(LIVRE_10X10, "[1,2]").status()).isEqualTo(StatusSimulacao.SEM_BLOCOS);
    }

    @Test
    void aninhamentoDeJsonAbsurdoViraSemBlocosSemEstourarAPilha() {
        String colchetes = "[".repeat(100_000) + "]".repeat(100_000);
        assertThat(simulador.simular(LIVRE_10X10, colchetes).status()).isEqualTo(StatusSimulacao.SEM_BLOCOS);

        StringBuilder fundo = new StringBuilder(moverCima("1"));
        for (int i = 0; i < 5000; i++) {
            fundo.insert(0, "{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10},\"inputs\":{\"FAZER\":{\"block\":")
                    .append("}}}");
        }
        assertThat(simulador.simular(LIVRE_10X10, workspace(fundo.toString())).status())
                .isEqualTo(StatusSimulacao.SEM_BLOCOS);
    }

    @Test
    void profundidadeAcimaDoLimiteDentroDoJacksonEhLimiteExcedido() {
        // 100 níveis via inputs (~400 níveis de JSON, abaixo do limite de 500 do Jackson).
        StringBuilder fundo = new StringBuilder(moverCima("1"));
        for (int i = 0; i < 99; i++) {
            fundo.insert(0, "{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10},\"inputs\":{\"FAZER\":{\"block\":")
                    .append("}}}");
        }
        ResultadoSimulacao r = simulador.simular(LIVRE_10X10, workspace(fundo.toString()));

        assertThat(r.status()).isEqualTo(StatusSimulacao.LIMITE_EXCEDIDO);
        assertThat(r.blocosUsados()).isZero();
        assertThat(r.passosExecutados()).isZero();
        assertThat(r.totalBlocosWorkspace()).isEqualTo(100);
    }

    @Test
    void cenarioInvalidoLancaExcecao() {
        assertThatThrownBy(() -> simulador.simular("{\"linhas\":2}", workspace(moverCima("1"))))
                .isInstanceOf(CenarioInvalidoException.class);
    }
}
