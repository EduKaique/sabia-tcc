package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.pratica.StatusPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Casos escritos à mão. Cenário livre 5x5: início (4,0) no canto de baixo à esquerda, destino (0,4)
 * no canto de cima à direita; o menor caminho tem 4 passos para cima + 4 para a direita = 8.
 */
class AnaliseRoboServiceTest {

    private static final String LIVRE = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}";
    /** Igual ao livre, com obstáculo em (2,0): subir 4 casas bate no 2º passo. */
    private static final String COM_OBSTACULO = LIVRE.replace("\"obstaculos\":[]", "\"obstaculos\":[{\"linha\":2,\"coluna\":0}]");
    /** 3x3 com o destino (2,2) cercado por (1,2) e (2,1): forma válida, sem caminho. */
    private static final String SEM_CAMINHO = "{\"versao\":1,\"linhas\":3,\"colunas\":3,"
            + "\"inicio\":{\"linha\":0,\"coluna\":0},\"destino\":{\"linha\":2,\"coluna\":2},"
            + "\"obstaculos\":[{\"linha\":1,\"coluna\":2},{\"linha\":2,\"coluna\":1}],"
            + "\"blocosPermitidos\":[\"robo_mover\"]}";

    private final AnaliseRoboService service = new AnaliseRoboService(new CenarioRoboValidador(JsonMapper.builder().build()));

    // ---- montagem do estado do Blockly ----

    private static String mover(String direcao, Object casas) {
        String valor = casas instanceof String ? "\"" + casas + "\"" : String.valueOf(casas);
        return "{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"" + direcao + "\",\"CASAS\":" + valor + "}}";
    }

    private static String repetir(int vezes, String corpo) {
        return "{\"type\":\"robo_repetir\",\"fields\":{\"VEZES\":" + vezes + "},\"inputs\":{\"FAZER\":{\"block\":" + corpo + "}}}";
    }

    /** Encadeia os blocos pela propriedade next. */
    private static String cadeia(String... blocos) {
        String resto = blocos[blocos.length - 1];
        for (int i = blocos.length - 2; i >= 0; i--) {
            String b = blocos[i];
            resto = b.substring(0, b.length() - 1) + ",\"next\":{\"block\":" + resto + "}}";
        }
        return resto;
    }

    /** Workspace com as pilhas na ordem dada: a primeira fica em cima (y=0) e é a principal. */
    private static String ws(String... pilhas) {
        List<String> topo = new ArrayList<>();
        for (int i = 0; i < pilhas.length; i++) {
            topo.add("{\"x\":0,\"y\":" + (i * 100) + "," + pilhas[i].substring(1));
        }
        return "{\"blocks\":{\"languageVersion\":0,\"blocks\":[" + String.join(",", topo) + "]}}";
    }

    // ---- casos ----

    @Test
    void solucaoMinimaTemEficienciaUm() {
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(mover("CIMA", 4), mover("DIREITA", 4))));

        // 4 + 4 = 8 passos; mínimo 8 -> 8/8 = 1,00; terminou no destino -> distância 0.
        assertThat(a.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(a.concluida()).isTrue();
        assertThat(a.passosExecutados()).isEqualTo(8);
        assertThat(a.passosMinimos()).isEqualTo(8);
        assertThat(a.eficiencia()).isEqualTo(new BigDecimal("1.00"));
        assertThat(a.distanciaAoDestino()).isZero();
        assertThat(a.blocosUsados()).isEqualTo(2);
        assertThat(a.totalBlocosWorkspace()).isEqualTo(2);
        assertThat(a.blocosSoltos()).isZero();
        assertThat(a.maxBlocos()).isNull();
        assertThat(a.quantidadeRepetir()).isZero();
        assertThat(a.profundidadeMaxima()).isZero();
        assertThat(a.maiorSequenciaIgual()).isEqualTo(1);
        assertThat(a.sequenciaRepetivel()).isFalse();
        assertThat(a.pseudocodigo()).isEqualTo("mover CIMA 4\nmover DIREITA 4");
        assertThat(a.pseudocodigoTruncado()).isFalse();
    }

    @Test
    void solucaoComDesvioTemEficienciaMenorQueUm() {
        // DIREITA 4 + ESQUERDA 1 + CIMA 4 + DIREITA 1 = 10 passos, termina em (0,4); 8/10 = 0,80.
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(
                mover("DIREITA", 4), mover("ESQUERDA", 1), mover("CIMA", 4), mover("DIREITA", 1))));

        assertThat(a.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(a.passosExecutados()).isEqualTo(10);
        assertThat(a.eficiencia()).isEqualTo(new BigDecimal("0.80"));
    }

    @Test
    void naoChegouNaoTemEficienciaETemDistancia() {
        // Sobe 1: termina em (3,0); distância |3-0| + |0-4| = 7.
        AnaliseRobo a = service.analisar(LIVRE, ws(mover("CIMA", 1)));

        assertThat(a.status()).isEqualTo(StatusPratica.NAO_CHEGOU);
        assertThat(a.passosExecutados()).isEqualTo(1);
        assertThat(a.eficiencia()).isNull();
        assertThat(a.distanciaAoDestino()).isEqualTo(7);
    }

    @Test
    void colisaoContaOPassoQueFalhouEFicaNaUltimaCasaValida() {
        // Sobe 4 com obstáculo em (2,0): 1º passo vai a (3,0), o 2º bate. 2 passos; distância 3 + 4 = 7.
        AnaliseRobo a = service.analisar(COM_OBSTACULO, ws(mover("CIMA", 4)));

        assertThat(a.status()).isEqualTo(StatusPratica.COLIDIU);
        assertThat(a.passosExecutados()).isEqualTo(2);
        assertThat(a.eficiencia()).isNull();
        assertThat(a.distanciaAoDestino()).isEqualTo(7);
    }

    @Test
    void saidaDaGrade() {
        // ESQUERDA a partir da coluna 0: 1 passo, fica no início (4,0); distância 4 + 4 = 8.
        AnaliseRobo a = service.analisar(LIVRE, ws(mover("ESQUERDA", 1)));

        assertThat(a.status()).isEqualTo(StatusPratica.SAIU_DO_GRID);
        assertThat(a.passosExecutados()).isEqualTo(1);
        assertThat(a.distanciaAoDestino()).isEqualTo(8);
    }

    @Test
    void semBlocos() {
        AnaliseRobo a = service.analisar(LIVRE, "{\"blocks\":{\"languageVersion\":0,\"blocks\":[]}}");

        assertThat(a.status()).isEqualTo(StatusPratica.SEM_BLOCOS);
        assertThat(a.passosExecutados()).isZero();
        assertThat(a.eficiencia()).isNull();
        assertThat(a.quantidadeRepetir()).isZero();
        assertThat(a.maiorSequenciaIgual()).isZero();
        assertThat(a.pseudocodigo()).isEqualTo(AnaliseRoboService.PROGRAMA_VAZIO);
    }

    @Test
    void repetirSimples() {
        // repetir 4 { CIMA 1 } = 4 passos, + DIREITA 4 = 8 -> chega com eficiência 1,00.
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(repetir(4, mover("CIMA", 1)), mover("DIREITA", 4))));

        assertThat(a.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(a.quantidadeRepetir()).isEqualTo(1);
        assertThat(a.profundidadeMaxima()).isEqualTo(1);
        assertThat(a.pseudocodigo()).isEqualTo("repetir 4 vezes\n  mover CIMA 1\nmover DIREITA 4");
    }

    @Test
    void repetirAninhado() {
        // repetir 2 { repetir 2 { CIMA 1 } } = 4 passos para cima, + DIREITA 4.
        AnaliseRobo a = service.analisar(LIVRE,
                ws(cadeia(repetir(2, repetir(2, mover("CIMA", 1))), mover("DIREITA", 4))));

        assertThat(a.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(a.quantidadeRepetir()).isEqualTo(2);
        assertThat(a.profundidadeMaxima()).isEqualTo(2);
        assertThat(a.pseudocodigo())
                .isEqualTo("repetir 2 vezes\n  repetir 2 vezes\n    mover CIMA 1\nmover DIREITA 4");
    }

    @Test
    void tresMoverIguaisConsecutivosSaoSequenciaRepetivel() {
        // CIMA 2, CIMA 1, CIMA 1: três blocos seguidos na mesma direção (conta blocos, não casas).
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(
                mover("CIMA", 2), mover("CIMA", 1), mover("CIMA", 1), mover("DIREITA", 4))));

        assertThat(a.maiorSequenciaIgual()).isEqualTo(3);
        assertThat(a.sequenciaRepetivel()).isTrue();
    }

    @Test
    void doisMoverIguaisNaoSaoSequenciaRepetivel() {
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(mover("CIMA", 2), mover("CIMA", 2), mover("DIREITA", 4))));

        assertThat(a.maiorSequenciaIgual()).isEqualTo(2);
        assertThat(a.sequenciaRepetivel()).isFalse();
    }

    @Test
    void sequenciaDentroDoFazerConta() {
        // CIMA 4; repetir 1 { DIREITA 2, DIREITA 1, DIREITA 1 }: a sequência de 3 fica no corpo.
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(mover("CIMA", 4),
                repetir(1, cadeia(mover("DIREITA", 2), mover("DIREITA", 1), mover("DIREITA", 1))))));

        assertThat(a.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(a.maiorSequenciaIgual()).isEqualTo(3);
        assertThat(a.sequenciaRepetivel()).isTrue();
    }

    @Test
    void blocosSoltosNaoEntramNaEstruturaNemNoPseudocodigo() {
        String principal = cadeia(mover("CIMA", 4), mover("DIREITA", 4));
        String solta = cadeia(mover("CIMA", 1), mover("CIMA", 1), mover("CIMA", 1), repetir(2, mover("BAIXO", 1)));

        AnaliseRobo a = service.analisar(LIVRE, ws(principal, solta));

        assertThat(a.blocosSoltos()).isEqualTo(1);
        assertThat(a.quantidadeRepetir()).isZero();
        assertThat(a.maiorSequenciaIgual()).isEqualTo(1);
        assertThat(a.pseudocodigo()).isEqualTo("mover CIMA 4\nmover DIREITA 4");
    }

    @Test
    void direcaoInvalidaEOutrosTiposSaoOmitidosECoercaoSegueOSimulador() {
        // "NORTE" e text_print são ignorados pelo simulador; CASAS "4.9" vira 4 e 50 vira 9.
        String outro = "{\"type\":\"text_print\"}";
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(
                mover("CIMA", "4.9"), mover("NORTE", 1), outro, mover("DIREITA", 4), mover("BAIXO", 50))));

        assertThat(a.pseudocodigo()).isEqualTo("mover CIMA 4\nmover DIREITA 4\nmover BAIXO 9");
    }

    @Test
    void pseudocodigoTruncaEm60Linhas() {
        // 70 movimentos alternados (CIMA 1 / BAIXO 1): 60 linhas + a linha de truncagem.
        String[] blocos = new String[70];
        for (int i = 0; i < blocos.length; i++) {
            blocos[i] = mover(i % 2 == 0 ? "CIMA" : "BAIXO", 1);
        }
        AnaliseRobo a = service.analisar(LIVRE, ws(cadeia(blocos)));

        String[] linhas = a.pseudocodigo().split("\n");
        assertThat(linhas).hasSize(AnaliseRoboService.MAX_LINHAS_PSEUDOCODIGO + 1);
        assertThat(linhas[linhas.length - 1]).isEqualTo(AnaliseRoboService.LINHA_TRUNCADO);
        assertThat(a.pseudocodigoTruncado()).isTrue();
        assertThat(a.passosExecutados()).isEqualTo(70);
    }

    @Test
    void estadoMalformadoOuCenarioAusenteDevolvemNulo() {
        assertThat(service.analisar(LIVRE, "{quebrado")).isNull();
        assertThat(service.analisar(LIVRE, null)).isNull();
        assertThat(service.analisar(null, ws(mover("CIMA", 1)))).isNull();
        assertThat(service.analisar("  ", ws(mover("CIMA", 1)))).isNull();
    }

    @Test
    void cenarioSemCaminhoNaoTemPassosMinimos() {
        AnaliseRobo a = service.analisar(SEM_CAMINHO, ws(mover("DIREITA", 1)));

        assertThat(a.status()).isEqualTo(StatusPratica.NAO_CHEGOU);
        assertThat(a.passosMinimos()).isNull();
        assertThat(a.eficiencia()).isNull();
    }

    @Test
    void limiteEBlocoNaoPermitidoVemDaValidacao() {
        String cenario = LIVRE.replace("\"robo_mover\",\"robo_repetir\"]", "\"robo_mover\"],\"maxBlocos\":1");
        AnaliseRobo a = service.analisar(cenario, ws(cadeia(repetir(4, mover("CIMA", 1)), mover("DIREITA", 4))));

        assertThat(a.maxBlocos()).isEqualTo(1);
        assertThat(a.excedeuLimiteBlocos()).isTrue();
        assertThat(a.usouBlocoNaoPermitido()).isTrue();
        assertThat(a.concluida()).isFalse();
    }
}
