package com.sabia.pedagogico.service.robo;

import com.sabia.pedagogico.service.CenarioRoboValidador;
import com.sabia.pedagogico.service.CenarioRoboValidador.Grade;
import com.sabia.pedagogico.service.CenarioRoboValidador.Posicao;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Simulador autoritativo do Jogo do Robô. Segue o contrato de fixtures/robo/README.md, o mesmo do
 * simulador TS (web/src/lib/simuladorRobo.ts), e é testado com os mesmos casos de fixtures/robo.
 * Puro: sem Spring, sem banco, sem I/O e sem log (o estado do aluno nunca é registrado).
 */
public class SimuladorRobo {

    public static final int LIMITE_PASSOS = 500;
    public static final int LIMITE_OPERACOES = 10_000;
    public static final int MAX_PROFUNDIDADE = 10;
    public static final int MAX_BLOCOS_WORKSPACE = 200;

    private static final int CASAS_MAX = 9;
    private static final int VEZES_MAX = 10;
    private static final Pattern DECIMAL = Pattern.compile("[+-]?(\\d+\\.?\\d*|\\.\\d+)");
    private static final Map<String, Posicao> DESLOCAMENTO = Map.of(
            "CIMA", new Posicao(-1, 0),
            "BAIXO", new Posicao(1, 0),
            "ESQUERDA", new Posicao(0, -1),
            "DIREITA", new Posicao(0, 1));
    /** Restrições de leitura padrão do Jackson (inclusive a de aninhamento); estourar vira SEM_BLOCOS. */
    private static final JsonMapper LEITOR_ESTADO = JsonMapper.builder().build();

    private final CenarioRoboValidador leitorCenario;

    public SimuladorRobo(CenarioRoboValidador leitorCenario) {
        this.leitorCenario = leitorCenario;
    }

    /**
     * Simula o estado (JSON de Blockly.serialization.workspaces.save) no cenário. O cenário deve
     * ser válido: se não for, lança {@link com.sabia.pedagogico.exception.CenarioInvalidoException}.
     * Qualquer estado (nulo, inválido, aninhado demais) produz um resultado, nunca exceção.
     */
    public ResultadoSimulacao simular(String cenarioJson, String estadoJson) {
        return simularEstado(cenarioJson, lerEstado(estadoJson));
    }

    /** Mesmo que {@link #simular(String, String)}, com o estado já lido (null = ilegível, R1). */
    public ResultadoSimulacao simularEstado(String cenarioJson, JsonNode estado) {
        Grade grade = leitorCenario.lerGrade(cenarioJson);
        JsonNode[] topo = blocosDeTopo(estado);
        int blocosSoltos = Math.max(0, topo.length - 1);

        AnaliseWorkspace analise = analisar(topo);
        int totalBlocos = analise.totalBlocos();
        if (analise.acimaDosLimites()) {
            return new ResultadoSimulacao(StatusSimulacao.LIMITE_EXCEDIDO, 0, 0, blocosSoltos,
                    grade.inicio(), totalBlocos);
        }

        JsonNode principal = pilhaPrincipal(topo);
        int blocosUsados = contarBlocosRobo(principal);
        Execucao execucao = new Execucao(grade);
        if (blocosUsados == 0) {
            return execucao.resultado(StatusSimulacao.SEM_BLOCOS, blocosUsados, blocosSoltos, totalBlocos);
        }

        try {
            execucao.executar(principal);
        } catch (Parada parada) {
            return execucao.resultado(parada.status, blocosUsados, blocosSoltos, totalBlocos);
        }
        StatusSimulacao status = execucao.posicao().equals(grade.destino())
                ? StatusSimulacao.CHEGOU : StatusSimulacao.NAO_CHEGOU;
        return execucao.resultado(status, blocosUsados, blocosSoltos, totalBlocos);
    }

    /**
     * Lê o estado com as restrições padrão do Jackson (inclusive 500 níveis de aninhamento).
     * Devolve null se o texto for nulo, ilegível ou aninhado demais.
     */
    public static JsonNode lerEstado(String estadoJson) {
        if (estadoJson == null) {
            return null;
        }
        try {
            return LEITOR_ESTADO.readTree(estadoJson);
        } catch (JacksonException e) {
            return null;
        }
    }

    /** R1: só blocks.blocks; estado nulo ou com formato inesperado = lista vazia. */
    public static JsonNode[] blocosDeTopo(JsonNode estado) {
        if (estado == null) {
            return new JsonNode[0];
        }
        JsonNode blocos = estado.path("blocks").path("blocks");
        if (!blocos.isArray()) {
            return new JsonNode[0];
        }
        JsonNode[] topo = new JsonNode[blocos.size()];
        for (int i = 0; i < topo.length; i++) {
            topo[i] = blocos.get(i);
        }
        return topo;
    }

    /**
     * Análise estrutural do workspace inteiro: total de blocos (sem sombras), maior profundidade via
     * inputs e tipos dos blocos. Iterativa, sem recursão.
     */
    public static AnaliseWorkspace analisar(JsonNode[] topo) {
        int total = 0;
        int profundidadeMaxima = 0;
        Set<String> tipos = new HashSet<>();
        Deque<Object[]> pendentes = new ArrayDeque<>();
        for (JsonNode bloco : topo) {
            pendentes.push(new Object[]{bloco, 1});
        }
        while (!pendentes.isEmpty()) {
            Object[] item = pendentes.pop();
            JsonNode bloco = (JsonNode) item[0];
            int profundidade = (int) item[1];
            if (!ehBloco(bloco)) {
                continue;
            }
            total++;
            profundidadeMaxima = Math.max(profundidadeMaxima, profundidade);
            String tipo = tipo(bloco);
            if (tipo != null) {
                tipos.add(tipo);
            }
            pendentes.push(new Object[]{bloco.path("next").path("block"), profundidade});
            JsonNode inputs = bloco.path("inputs");
            if (inputs.isContainer()) {
                for (JsonNode input : inputs.values()) {
                    pendentes.push(new Object[]{input.path("block"), profundidade + 1});
                }
            }
        }
        return new AnaliseWorkspace(total, profundidadeMaxima, Set.copyOf(tipos));
    }

    /** Resultado de {@link #analisar}; os tipos são os de todos os blocos não-sombra, de todas as pilhas. */
    public record AnaliseWorkspace(int totalBlocos, int profundidadeMaxima, Set<String> tipos) {
        public boolean acimaDosLimites() {
            return profundidadeMaxima > MAX_PROFUNDIDADE || totalBlocos > MAX_BLOCOS_WORKSPACE;
        }
    }

    /** R2: menor y, depois menor x (ausentes = 0); no empate total, o primeiro da lista. */
    private static JsonNode pilhaPrincipal(JsonNode[] topo) {
        JsonNode principal = null;
        double menorY = 0;
        double menorX = 0;
        for (JsonNode bloco : topo) {
            double y = coordenada(bloco, "y");
            double x = coordenada(bloco, "x");
            if (principal == null || y < menorY || (y == menorY && x < menorX)) {
                principal = bloco;
                menorY = y;
                menorX = x;
            }
        }
        return principal;
    }

    private static double coordenada(JsonNode bloco, String eixo) {
        JsonNode valor = bloco.path(eixo);
        return valor.isNumber() ? valor.doubleValue() : 0;
    }

    /** R3: robo_mover + robo_repetir da cadeia, incluindo o corpo dos repetir (profundidade já limitada). */
    private static int contarBlocosRobo(JsonNode bloco) {
        int total = 0;
        for (JsonNode atual = bloco; ehBloco(atual); atual = atual.path("next").path("block")) {
            String tipo = tipo(atual);
            if ("robo_mover".equals(tipo)) {
                total++;
            } else if ("robo_repetir".equals(tipo)) {
                total += 1 + contarBlocosRobo(atual.path("inputs").path("FAZER").path("block"));
            }
        }
        return total;
    }

    private static boolean ehBloco(JsonNode no) {
        return no != null && no.isObject();
    }

    /** O type do bloco, se for texto; senão null. */
    public static String tipo(JsonNode bloco) {
        JsonNode tipo = bloco.path("type");
        return tipo.isString() ? tipo.stringValue() : null;
    }

    /**
     * Coerção de CASAS e VEZES: número JSON truncado; string decimal (com espaços, sinal e ponto)
     * convertida e truncada; o resto vale 1. Depois, limitado a [1, max].
     */
    static int inteiroEntre(JsonNode valor, int max) {
        double numero;
        if (valor != null && valor.isNumber()) {
            numero = valor.doubleValue();
        } else if (valor != null && valor.isString() && DECIMAL.matcher(valor.stringValue().strip()).matches()) {
            numero = Double.parseDouble(valor.stringValue().strip());
        } else {
            return 1;
        }
        if (!Double.isFinite(numero)) {
            return 1;
        }
        double truncado = numero < 0 ? Math.ceil(numero) : Math.floor(numero);
        return (int) Math.min(max, Math.max(1, truncado));
    }

    /** Estado de uma execução: posição, passos e operações. */
    private static final class Execucao {
        private final Grade grade;
        private int linha;
        private int coluna;
        private int passos;
        private int operacoes;

        Execucao(Grade grade) {
            this.grade = grade;
            this.linha = grade.inicio().linha();
            this.coluna = grade.inicio().coluna();
        }

        Posicao posicao() {
            return new Posicao(linha, coluna);
        }

        ResultadoSimulacao resultado(StatusSimulacao status, int blocosUsados, int blocosSoltos, int totalBlocos) {
            return new ResultadoSimulacao(status, blocosUsados, passos, blocosSoltos, posicao(), totalBlocos);
        }

        private void operar() {
            operacoes++;
            if (operacoes > LIMITE_OPERACOES) {
                throw new Parada(StatusSimulacao.LIMITE_EXCEDIDO);
            }
        }

        /** A cadeia next em laço; a recursão só desce em FAZER (profundidade já limitada). */
        void executar(JsonNode bloco) {
            for (JsonNode atual = bloco; ehBloco(atual); atual = atual.path("next").path("block")) {
                operar();
                String tipo = tipo(atual);
                if ("robo_mover".equals(tipo)) {
                    JsonNode direcao = atual.path("fields").path("DIRECAO");
                    if (direcao.isString() && DESLOCAMENTO.containsKey(direcao.stringValue())) {
                        mover(DESLOCAMENTO.get(direcao.stringValue()),
                                inteiroEntre(atual.path("fields").get("CASAS"), CASAS_MAX));
                    }
                } else if ("robo_repetir".equals(tipo)) {
                    int vezes = inteiroEntre(atual.path("fields").get("VEZES"), VEZES_MAX);
                    JsonNode corpo = atual.path("inputs").path("FAZER").path("block");
                    for (int i = 0; i < vezes; i++) {
                        operar();
                        executar(corpo);
                    }
                }
            }
        }

        private void mover(Posicao deslocamento, int casas) {
            for (int i = 0; i < casas; i++) {
                if (passos >= LIMITE_PASSOS) {
                    throw new Parada(StatusSimulacao.LIMITE_EXCEDIDO);
                }
                int novaLinha = linha + deslocamento.linha();
                int novaColuna = coluna + deslocamento.coluna();
                boolean foraDaGrade = novaLinha < 0 || novaLinha >= grade.linhas()
                        || novaColuna < 0 || novaColuna >= grade.colunas();
                boolean colidiu = !foraDaGrade && grade.obstaculos().contains(new Posicao(novaLinha, novaColuna));
                passos++;
                if (foraDaGrade || colidiu) {
                    throw new Parada(foraDaGrade ? StatusSimulacao.SAIU_DO_GRID : StatusSimulacao.COLIDIU);
                }
                linha = novaLinha;
                coluna = novaColuna;
            }
        }
    }

    /** Interrompe a execução assim que o resultado fica definido (sem stack trace). */
    private static final class Parada extends RuntimeException {
        private final StatusSimulacao status;

        Parada(StatusSimulacao status) {
            super(null, null, false, false);
            this.status = status;
        }
    }
}
