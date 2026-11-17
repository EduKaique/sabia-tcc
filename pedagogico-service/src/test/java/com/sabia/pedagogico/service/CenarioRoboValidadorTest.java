package com.sabia.pedagogico.service;

import com.sabia.pedagogico.exception.CenarioInvalidoException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Forma, obstáculos repetidos e resolubilidade (BFS em 4 direções) do cenário do Jogo do Robô. */
class CenarioRoboValidadorTest {

    private final CenarioRoboValidador validador = new CenarioRoboValidador(JsonMapper.builder().build());

    /** Monta o cenarioJson com os dois blocos permitidos; posições como {linha, coluna}. */
    private static String cenario(int linhas, int colunas, int[] inicio, int[] destino, int[]... obstaculos) {
        StringBuilder obs = new StringBuilder();
        for (int[] o : obstaculos) {
            if (!obs.isEmpty()) obs.append(',');
            obs.append(pos(o));
        }
        return "{\"versao\":1,\"linhas\":" + linhas + ",\"colunas\":" + colunas
                + ",\"inicio\":" + pos(inicio) + ",\"destino\":" + pos(destino)
                + ",\"obstaculos\":[" + obs + "],\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}";
    }

    private static String pos(int[] p) {
        return "{\"linha\":" + p[0] + ",\"coluna\":" + p[1] + "}";
    }

    private static int[] p(int linha, int coluna) {
        return new int[]{linha, coluna};
    }

    private void aceito(String json, int passosEsperados) {
        assertThatCode(() -> validador.validar(json)).doesNotThrowAnyException();
        assertThat(validador.menorCaminho(json)).isEqualTo(passosEsperados);
    }

    private void semCaminho(String json) {
        assertThat(validador.menorCaminho(json)).isEqualTo(-1);
        assertThatThrownBy(() -> validador.validar(json))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("O cenário não tem caminho do início ao destino.");
    }

    @Test
    void caminhoLivreUsaADistanciaEmLinhaReta() {
        // 3x3, (2,0) -> (0,2): 2 para cima + 2 para a direita = 4.
        aceito(cenario(3, 3, p(2, 0), p(0, 2)), 4);
    }

    @Test
    void caminhoSoPorContorno() {
        // 3x3, (1,0) -> (1,2), parede em (0,1) e (1,1): só passa por baixo.
        // (1,0)->(2,0)->(2,1)->(2,2)->(1,2) = 4 passos (em linha reta seriam 2).
        aceito(cenario(3, 3, p(1, 0), p(1, 2), p(0, 1), p(1, 1)), 4);
    }

    @Test
    void destinoCercadoPorObstaculosEImpossivel() {
        // Destino (1,1) no centro com os 4 vizinhos bloqueados.
        semCaminho(cenario(3, 3, p(0, 0), p(1, 1), p(0, 1), p(1, 0), p(1, 2), p(2, 1)));
    }

    @Test
    void inicioCercadoPorObstaculosEImpossivel() {
        // Início no canto (0,0) com os 2 vizinhos bloqueados.
        semCaminho(cenario(3, 3, p(0, 0), p(2, 2), p(0, 1), p(1, 0)));
    }

    @Test
    void inicioEDestinoAdjacentes() {
        aceito(cenario(3, 3, p(0, 0), p(0, 1)), 1);
    }

    @Test
    void cenarioProntoLivre5x5() {
        // CENARIO_LIVRE_5X5 (web/src/lib/cenariosRobo.ts) e seed teste-robo-01: (4,0) -> (0,4).
        // Sem obstáculos: 4 para cima + 4 para a direita = 8.
        aceito(cenario(5, 5, p(4, 0), p(0, 4)), 8);
    }

    @Test
    void cenarioProntoComObstaculos5x5() {
        // CENARIO_OBSTACULOS_5X5: (4,0) -> (0,4), obstáculos em (2,0) e (4,2).
        // 8 é o mínimo (distância de Manhattan) e é alcançável sem tocar os obstáculos:
        // (4,0)->(4,1)->(3,1)->(2,1)->(1,1)->(0,1)->(0,2)->(0,3)->(0,4) = 8 passos.
        aceito(cenario(5, 5, p(4, 0), p(0, 4), p(2, 0), p(4, 2)), 8);
    }

    @Test
    void obstaculoRepetidoERecusado() {
        assertThatThrownBy(() -> validador.validar(cenario(5, 5, p(4, 0), p(0, 4), p(2, 2), p(2, 2))))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("Há obstáculos repetidos.");
    }

    @Test
    void obstaculoNoInicioOuNoDestinoContinuaErro() {
        assertThatThrownBy(() -> validador.validar(cenario(5, 5, p(4, 0), p(0, 4), p(4, 0))))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("Obstáculos não podem ficar no início nem no destino.");
        assertThatThrownBy(() -> validador.validar(cenario(5, 5, p(4, 0), p(0, 4), p(0, 4))))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("Obstáculos não podem ficar no início nem no destino.");
    }

    @Test
    void grade10x10ResolvelComParede() {
        // Parede na coluna 5 da linha 0 à 8, aberta só na linha 9.
        // (0,0) -> (0,9): desce 9, anda 9 para a direita, sobe 9 = 27 passos.
        int[][] parede = new int[9][];
        for (int l = 0; l < 9; l++) parede[l] = p(l, 5);
        aceito(cenario(10, 10, p(0, 0), p(0, 9), parede), 27);
    }

    @Test
    void grade10x10ImpossivelComParedeCompleta() {
        int[][] parede = new int[10][];
        for (int l = 0; l < 10; l++) parede[l] = p(l, 5);
        semCaminho(cenario(10, 10, p(0, 0), p(0, 9), parede));
    }

    @Test
    void menorCaminhoAindaRecusaFormaInvalida() {
        assertThatThrownBy(() -> validador.menorCaminho(cenario(2, 5, p(0, 0), p(1, 1))))
                .isInstanceOf(CenarioInvalidoException.class);
    }
}
