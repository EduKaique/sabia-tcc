package com.sabia.pedagogico.service.pratica;

import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.json.JsonMapper;

import static com.sabia.pedagogico.model.atividade.ModoAtividade.BLOCOS;
import static com.sabia.pedagogico.model.atividade.ModoAtividade.JOGO_ROBO;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Regras da validação da prática (fixtures/blocos-livres/README.md). */
class ValidadorPraticaTest {

    private final ValidadorPratica validador =
            new ValidadorPratica(new CenarioRoboValidador(JsonMapper.builder().build()));

    /** 5x5, de (4,0) a (0,4), com obstáculo em (2,2); extras entram no fim do objeto. */
    static String cenario(String extras) {
        return "{\"versao\":1,\"linhas\":5,\"colunas\":5,\"inicio\":{\"linha\":4,\"coluna\":0},"
                + "\"destino\":{\"linha\":0,\"coluna\":4},\"obstaculos\":[{\"linha\":2,\"coluna\":2}],"
                + "\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]" + extras + "}";
    }

    static String mover(String direcao, int casas, String proximo) {
        return "{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"" + direcao + "\",\"CASAS\":" + casas + "}"
                + (proximo == null ? "" : ",\"next\":{\"block\":" + proximo + "}") + "}";
    }

    static String ws(String... topo) {
        return "{\"blocks\":{\"languageVersion\":0,\"blocks\":[" + String.join(",", topo) + "]}}";
    }

    /** Solução com 2 blocos: 4 para cima e 4 para a direita. */
    static final String SOLUCAO = ws(mover("CIMA", 4, mover("DIREITA", 4, null)));

    @Test
    void roboQueChegaEstaConcluido() {
        ResultadoValidacao r = validador.validar(JOGO_ROBO, cenario(""), SOLUCAO);

        assertThat(r.concluida()).isTrue();
        assertThat(r.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(r.versaoValidador()).isEqualTo(1);
        assertThat(r.modo()).isEqualTo(JOGO_ROBO);
        assertThat(r.motivo()).isNull();
        assertThat(r.blocosUsados()).isEqualTo(2);
        assertThat(r.totalBlocosWorkspace()).isEqualTo(2);
        assertThat(r.passosExecutados()).isEqualTo(8);
        assertThat(r.posicaoFinal().linha()).isZero();
        assertThat(r.maxBlocos()).isNull();
        assertThat(r.excedeuLimiteBlocos()).isFalse();
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', value = {
            "NAO_CHEGOU|{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":1}}|não chegou",
            "COLIDIU|{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":2},\"next\":{\"block\":{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"DIREITA\",\"CASAS\":3}}}}|obstáculo",
            "SAIU_DO_GRID|{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"BAIXO\",\"CASAS\":1}}|saiu da grade",
            "LIMITE_EXCEDIDO|{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10},\"inputs\":{\"FAZER\":{\"block\":{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10},\"inputs\":{\"FAZER\":{\"block\":{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10},\"inputs\":{\"FAZER\":{\"block\":{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":10}}}}}}}}}}}|limite de execução"})
    void roboQueNaoChegaNaoConcluiETemMotivo(String status, String bloco, String trechoMotivo) {
        ResultadoValidacao r = validador.validar(JOGO_ROBO, cenario(""), ws(bloco));

        assertThat(r.status()).isEqualTo(StatusPratica.valueOf(status));
        assertThat(r.concluida()).isFalse();
        assertThat(r.motivo()).contains(trechoMotivo);
    }

    @Test
    void roboSemBlocosNaoConclui() {
        ResultadoValidacao r = validador.validar(JOGO_ROBO, cenario(""), ws());

        assertThat(r.status()).isEqualTo(StatusPratica.SEM_BLOCOS);
        assertThat(r.concluida()).isFalse();
        assertThat(r.motivo()).isNotBlank();
    }

    @Test
    void limiteDeBlocosIgualPassaEUmAMaisNao() {
        ResultadoValidacao igual = validador.validar(JOGO_ROBO, cenario(",\"maxBlocos\":2"), SOLUCAO);
        assertThat(igual.concluida()).isTrue();
        assertThat(igual.excedeuLimiteBlocos()).isFalse();
        assertThat(igual.maxBlocos()).isEqualTo(2);

        // Um bloco solto também conta no total (mesma contagem do "Blocos: X / max" do aluno).
        String comSolto = ws(mover("CIMA", 4, mover("DIREITA", 4, null)),
                mover("BAIXO", 1, null).replace("{\"type\"", "{\"y\":300,\"type\""));
        ResultadoValidacao acima = validador.validar(JOGO_ROBO, cenario(",\"maxBlocos\":2"), comSolto);
        assertThat(acima.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(acima.totalBlocosWorkspace()).isEqualTo(3);
        assertThat(acima.excedeuLimiteBlocos()).isTrue();
        assertThat(acima.concluida()).isFalse();
        assertThat(acima.motivo()).isEqualTo("Você usou 3 blocos, mas o limite desta atividade é 2.");
    }

    @Test
    void semMaxBlocosNuncaExcede() {
        StringBuilder muitos = new StringBuilder(mover("DIREITA", 4, null));
        for (int i = 0; i < 4; i++) {
            muitos.insert(0, "{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":1},\"next\":{\"block\":")
                    .append("}}");
        }
        ResultadoValidacao r = validador.validar(JOGO_ROBO, cenario(""), ws(muitos.toString()));

        assertThat(r.totalBlocosWorkspace()).isEqualTo(5);
        assertThat(r.excedeuLimiteBlocos()).isFalse();
        assertThat(r.concluida()).isTrue();
    }

    @Test
    void blocoNaoPermitidoEmQualquerPilhaImpedeAConclusao() {
        String soMover = "{\"versao\":1,\"linhas\":5,\"colunas\":5,\"inicio\":{\"linha\":4,\"coluna\":0},"
                + "\"destino\":{\"linha\":0,\"coluna\":4},\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\"]}";
        String solto = "{\"type\":\"text_print\",\"y\":300}";

        ResultadoValidacao r = validador.validar(JOGO_ROBO, soMover, ws(SOLUCAO_BLOCO, solto));

        assertThat(r.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(r.usouBlocoNaoPermitido()).isTrue();
        assertThat(r.concluida()).isFalse();
        assertThat(r.motivo()).contains("não está liberado");

        String comRepetir = ws("{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":4},\"inputs\":{\"FAZER\":{\"block\":"
                + mover("CIMA", 1, null) + "}},\"next\":{\"block\":" + mover("DIREITA", 4, null) + "}}");
        assertThat(validador.validar(JOGO_ROBO, soMover, comRepetir).usouBlocoNaoPermitido()).isTrue();
    }

    static final String SOLUCAO_BLOCO = mover("CIMA", 4, mover("DIREITA", 4, null));

    @Test
    void roboSemCenarioOuComCenarioCorrompidoResponde422() {
        assertThatThrownBy(() -> validador.validar(JOGO_ROBO, null, SOLUCAO))
                .isInstanceOf(OperacaoInvalidaException.class).hasMessageContaining("sem cenário");
        assertThatThrownBy(() -> validador.validar(JOGO_ROBO, "  ", SOLUCAO))
                .isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> validador.validar(JOGO_ROBO, "{\"linhas\":2}", SOLUCAO))
                .isInstanceOf(OperacaoInvalidaException.class);
    }

    @Test
    void blocosLivresComComandoNoTopoConclui() {
        String imprimir = "{\"type\":\"text_print\",\"inputs\":{\"TEXT\":{\"shadow\":{\"type\":\"text\"},"
                + "\"block\":{\"type\":\"text\",\"fields\":{\"TEXT\":\"oi\"}}}}}";

        ResultadoValidacao r = validador.validar(BLOCOS, null, ws(imprimir));

        assertThat(r.modo()).isEqualTo(BLOCOS);
        assertThat(r.status()).isEqualTo(StatusPratica.BLOCOS_LIVRES_OK);
        assertThat(r.concluida()).isTrue();
        assertThat(r.motivo()).isNull();
        assertThat(r.totalBlocosWorkspace()).isEqualTo(2);
        assertThat(r.posicaoFinal()).isNull();
    }

    @Test
    void blocosLivresSoComValorNoTopoOuVazioNaoConclui() {
        String soma = "{\"type\":\"math_arithmetic\",\"inputs\":{\"A\":{\"block\":{\"type\":\"math_number\"}}}}";
        String definicao = "{\"type\":\"procedures_defnoreturn\",\"inputs\":{\"STACK\":{\"block\":{\"type\":\"text_print\"}}}}";

        for (String estado : new String[]{ws(soma), ws(definicao), ws(), "{}"}) {
            ResultadoValidacao r = validador.validar(BLOCOS, null, estado);
            assertThat(r.status()).isEqualTo(StatusPratica.BLOCOS_LIVRES_VAZIO);
            assertThat(r.concluida()).isFalse();
            assertThat(r.motivo()).isNotBlank();
        }
    }

    @Test
    void blocosLivresAcimaDosLimitesNaoConclui() {
        StringBuilder cadeia = new StringBuilder("{\"type\":\"text_print\"}");
        for (int i = 0; i < 200; i++) {
            cadeia.insert(0, "{\"type\":\"text_print\",\"next\":{\"block\":").append("}}");
        }
        ResultadoValidacao r = validador.validar(BLOCOS, null, ws(cadeia.toString()));

        assertThat(r.totalBlocosWorkspace()).isEqualTo(201);
        assertThat(r.status()).isEqualTo(StatusPratica.LIMITE_EXCEDIDO);
        assertThat(r.concluida()).isFalse();
    }

    @Test
    void modoNuloEhTratadoComoBlocosLivres() {
        assertThat(validador.validar(null, null, ws("{\"type\":\"text_print\"}")).modo()).isEqualTo(BLOCOS);
    }

    @Test
    void jsonIlegivelOuAninhadoDemaisEhEntradaInvalida() {
        for (ModoAtividade modo : ModoAtividade.values()) {
            assertThatThrownBy(() -> validador.validar(modo, cenario(""), "{isto não é json"))
                    .isInstanceOf(EstadoPraticaInvalidoException.class);
            assertThatThrownBy(() -> validador.validar(modo, cenario(""), "[".repeat(100_000) + "]".repeat(100_000)))
                    .isInstanceOf(EstadoPraticaInvalidoException.class);
        }
    }
}
