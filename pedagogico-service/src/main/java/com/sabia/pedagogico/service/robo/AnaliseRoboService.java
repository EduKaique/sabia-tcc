package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.CenarioRoboValidador.Posicao;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;
import com.sabia.pedagogico.service.pratica.StatusPratica;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Análise do programa do aluno no Jogo do Robô para o relatório de correção por IA: métricas e
 * pseudocódigo (definições em fixtures/robo/README.md, "Análise para o relatório"). Recalcula do
 * zero com o mesmo motor da validação. Sem banco, sem I/O e sem log; o @Component é só para
 * injeção, como no ValidadorPratica.
 */
@Component
public class AnaliseRoboService {

    public static final int MAX_LINHAS_PSEUDOCODIGO = 60;
    public static final String LINHA_TRUNCADO = "... (programa truncado)";
    public static final String PROGRAMA_VAZIO = "(programa vazio)";
    private static final int SEQUENCIA_REPETIVEL = 3;

    private final CenarioRoboValidador cenarioRoboValidador;
    private final ValidadorPratica validadorPratica;

    public AnaliseRoboService(CenarioRoboValidador cenarioRoboValidador) {
        this.cenarioRoboValidador = cenarioRoboValidador;
        this.validadorPratica = new ValidadorPratica(cenarioRoboValidador);
    }

    /**
     * Nulo se o cenário estiver em branco ou o estado for ilegível. Cenário inválido lança exceção
     * (quem chama decide; no detalhe do professor vira nulo).
     */
    public AnaliseRobo analisar(String cenarioJson, String estadoJson) {
        if (cenarioJson == null || cenarioJson.isBlank()) {
            return null;
        }
        JsonNode estado = SimuladorRobo.lerEstado(estadoJson);
        if (estado == null) {
            return null;
        }

        ResultadoValidacao v = validadorPratica.validar(ModoAtividade.JOGO_ROBO, cenarioJson, estadoJson);
        int menor = cenarioRoboValidador.menorCaminho(cenarioJson);
        Integer passosMinimos = menor >= 0 ? menor : null;
        BigDecimal eficiencia = v.status() == StatusPratica.CHEGOU && v.passosExecutados() > 0 && passosMinimos != null
                ? BigDecimal.valueOf(passosMinimos).divide(BigDecimal.valueOf(v.passosExecutados()), 2, RoundingMode.HALF_UP)
                : null;
        Posicao destino = cenarioRoboValidador.lerGrade(cenarioJson).destino();
        Posicao fim = v.posicaoFinal();
        Integer distancia = fim != null
                ? Math.abs(fim.linha() - destino.linha()) + Math.abs(fim.coluna() - destino.coluna())
                : null;

        Percurso p = new Percurso();
        JsonNode principal = SimuladorRobo.pilhaPrincipal(SimuladorRobo.blocosDeTopo(estado));
        if (principal != null) {
            p.cadeia(principal, 0);
        }

        return new AnaliseRobo(v.status(), v.concluida(), v.blocosUsados(), v.totalBlocosWorkspace(), v.maxBlocos(),
                v.blocosSoltos(), v.excedeuLimiteBlocos(), v.usouBlocoNaoPermitido(), v.passosExecutados(),
                passosMinimos, eficiencia, p.repetir, p.profundidadeMaxima, p.maiorSequencia,
                p.maiorSequencia >= SEQUENCIA_REPETIVEL, distancia, p.pseudocodigo(), p.truncado);
    }

    /** Um passeio pela pilha principal: contagens de estrutura e linhas do pseudocódigo. */
    private static final class Percurso {
        private final List<String> linhas = new ArrayList<>();
        private boolean truncado;
        private int visitados;
        private int repetir;
        private int profundidadeMaxima;
        private int maiorSequencia;

        /** A cadeia next em laço; a recursão só desce no FAZER, com profundidade limitada. */
        void cadeia(JsonNode bloco, int nivel) {
            String ultimaDirecao = null;
            int sequencia = 0;
            for (JsonNode atual = bloco; atual != null && atual.isObject(); atual = atual.path("next").path("block")) {
                if (++visitados > SimuladorRobo.MAX_BLOCOS_WORKSPACE) {
                    truncado = true;
                    return;
                }
                String tipo = SimuladorRobo.tipo(atual);
                JsonNode campos = atual.path("fields");
                JsonNode direcao = campos.path("DIRECAO");
                if ("robo_mover".equals(tipo) && direcao.isString()
                        && SimuladorRobo.DESLOCAMENTO.containsKey(direcao.stringValue())) {
                    String nome = direcao.stringValue();
                    sequencia = nome.equals(ultimaDirecao) ? sequencia + 1 : 1;
                    ultimaDirecao = nome;
                    maiorSequencia = Math.max(maiorSequencia, sequencia);
                    linha(nivel, "mover " + nome + " " + SimuladorRobo.inteiroEntre(campos.get("CASAS"), SimuladorRobo.CASAS_MAX));
                    continue;
                }
                // Qualquer outro bloco interrompe a sequência de movimentos iguais.
                ultimaDirecao = null;
                sequencia = 0;
                if ("robo_repetir".equals(tipo)) {
                    repetir++;
                    profundidadeMaxima = Math.max(profundidadeMaxima, nivel + 1);
                    linha(nivel, "repetir " + SimuladorRobo.inteiroEntre(campos.get("VEZES"), SimuladorRobo.VEZES_MAX) + " vezes");
                    if (nivel + 1 >= SimuladorRobo.MAX_PROFUNDIDADE) {
                        truncado = true;
                    } else {
                        cadeia(atual.path("inputs").path("FAZER").path("block"), nivel + 1);
                    }
                }
                // Outros tipos e mover com direção inválida não executam: ficam fora do pseudocódigo.
            }
        }

        private void linha(int nivel, String texto) {
            if (linhas.size() >= MAX_LINHAS_PSEUDOCODIGO) {
                truncado = true;
                return;
            }
            linhas.add("  ".repeat(nivel) + texto);
        }

        String pseudocodigo() {
            List<String> saida = new ArrayList<>(linhas);
            if (saida.isEmpty() && !truncado) {
                return PROGRAMA_VAZIO;
            }
            if (truncado) {
                saida.add(LINHA_TRUNCADO);
            }
            return String.join("\n", saida);
        }
    }
}
