package com.sabia.pedagogico.service.pratica;

import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.robo.ResultadoSimulacao;
import com.sabia.pedagogico.service.robo.SimuladorRobo;
import com.sabia.pedagogico.service.robo.SimuladorRobo.AnaliseWorkspace;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.HashSet;
import java.util.Set;

/**
 * Decide no servidor se a prática foi concluída (regras em fixtures/blocos-livres/README.md).
 * Só recusa entrada malformada (JSON ilegível ou aninhado demais); qualquer outra violação vira
 * resultado registrado. Nunca registra o estado nem o cenário em log.
 */
@Component
public class ValidadorPratica {

    /**
     * Tipos de bloco de comando (encaixam numa sequência). Igual à chave "comandos" de
     * fixtures/blocos-livres/classificacao.json (conferido por teste); embutido porque os fixtures
     * não vão na imagem.
     */
    public static final Set<String> COMANDOS = Set.of(
            "text_print", "controls_if", "controls_repeat_ext", "controls_whileUntil", "controls_for",
            "controls_forEach", "controls_flow_statements", "text_append", "lists_setIndex", "variables_set",
            "math_change", "procedures_callnoreturn", "robo_mover", "robo_repetir");

    private final CenarioRoboValidador cenarioRoboValidador;
    private final SimuladorRobo simulador;

    public ValidadorPratica(CenarioRoboValidador cenarioRoboValidador) {
        this.cenarioRoboValidador = cenarioRoboValidador;
        this.simulador = new SimuladorRobo(cenarioRoboValidador);
    }

    public ResultadoValidacao validar(ModoAtividade modo, String cenarioJson, String estadoJson) {
        JsonNode estado = SimuladorRobo.lerEstado(estadoJson);
        if (estado == null) {
            throw new EstadoPraticaInvalidoException("O projeto enviado não é um JSON válido.");
        }
        return modo == ModoAtividade.JOGO_ROBO ? validarRobo(cenarioJson, estado) : validarBlocosLivres(estado);
    }

    private ResultadoValidacao validarRobo(String cenarioJson, JsonNode estado) {
        if (cenarioJson == null || cenarioJson.isBlank()) {
            throw semCenario();
        }
        ResultadoSimulacao sim;
        JsonNode cenario;
        try {
            sim = simulador.simularEstado(cenarioJson, estado);
            cenario = cenarioRoboValidador.ler(cenarioJson);
        } catch (CenarioInvalidoException e) {
            throw semCenario();
        }

        JsonNode max = cenario.path("maxBlocos");
        Integer maxBlocos = max.isIntegralNumber() && max.canConvertToInt() ? max.intValue() : null;
        boolean excedeu = maxBlocos != null && sim.totalBlocosWorkspace() > maxBlocos;

        Set<String> permitidos = new HashSet<>();
        for (JsonNode tipo : cenario.path("blocosPermitidos")) {
            permitidos.add(tipo.isString() ? tipo.stringValue() : "");
        }
        AnaliseWorkspace analise = SimuladorRobo.analisar(SimuladorRobo.blocosDeTopo(estado));
        boolean naoPermitido = !permitidos.containsAll(analise.tipos());

        StatusPratica status = StatusPratica.valueOf(sim.status().name());
        boolean concluida = status == StatusPratica.CHEGOU && !excedeu && !naoPermitido;
        String motivo = concluida ? null : motivoRobo(status, naoPermitido, excedeu, sim.totalBlocosWorkspace(), maxBlocos);
        return new ResultadoValidacao(ResultadoValidacao.VERSAO_VALIDADOR, ModoAtividade.JOGO_ROBO, concluida, status,
                sim.blocosUsados(), sim.totalBlocosWorkspace(), maxBlocos, excedeu, naoPermitido,
                sim.passosExecutados(), sim.blocosSoltos(), sim.posicaoFinal(), motivo);
    }

    /**
     * Blocos livres: o servidor não executa o código do aluno. Conclui se o workspace está dentro dos
     * limites estruturais e algum bloco de topo é de comando.
     */
    private ResultadoValidacao validarBlocosLivres(JsonNode estado) {
        JsonNode[] topo = SimuladorRobo.blocosDeTopo(estado);
        AnaliseWorkspace analise = SimuladorRobo.analisar(topo);
        StatusPratica status;
        if (analise.acimaDosLimites()) {
            status = StatusPratica.LIMITE_EXCEDIDO;
        } else {
            boolean temComando = false;
            for (JsonNode bloco : topo) {
                temComando |= COMANDOS.contains(SimuladorRobo.tipo(bloco));
            }
            status = temComando ? StatusPratica.BLOCOS_LIVRES_OK : StatusPratica.BLOCOS_LIVRES_VAZIO;
        }
        boolean concluida = status == StatusPratica.BLOCOS_LIVRES_OK;
        String motivo = switch (status) {
            case LIMITE_EXCEDIDO -> "O programa passou do limite de " + SimuladorRobo.MAX_BLOCOS_WORKSPACE
                    + " blocos ou de " + SimuladorRobo.MAX_PROFUNDIDADE + " níveis de encaixe.";
            case BLOCOS_LIVRES_VAZIO -> "Monte um programa com pelo menos um bloco de comando, como \"imprimir\".";
            default -> null;
        };
        return new ResultadoValidacao(ResultadoValidacao.VERSAO_VALIDADOR, ModoAtividade.BLOCOS, concluida, status,
                analise.totalBlocos(), analise.totalBlocos(), null, false, false, 0, 0, null, motivo);
    }

    private static String motivoRobo(StatusPratica status, boolean naoPermitido, boolean excedeu,
                                     int total, Integer maxBlocos) {
        return switch (status) {
            case NAO_CHEGOU -> "O robô não chegou ao destino. Confira o caminho e tente de novo.";
            case COLIDIU -> "O robô bateu num obstáculo. Tente outro caminho.";
            case SAIU_DO_GRID -> "O robô saiu da grade. Confira as direções e a quantidade de casas.";
            case LIMITE_EXCEDIDO -> "O programa passou do limite de execução. Tente usar menos repetições.";
            case SEM_BLOCOS -> "Monte o programa com os blocos do robô antes de enviar.";
            default -> naoPermitido
                    ? "Você usou um bloco que não está liberado nesta atividade."
                    : excedeu ? "Você usou " + total + " blocos, mas o limite desta atividade é " + maxBlocos + "."
                    : null;
        };
    }

    private static OperacaoInvalidaException semCenario() {
        return new OperacaoInvalidaException("Esta atividade do Jogo do Robô está sem cenário válido. Avise o professor.");
    }
}
