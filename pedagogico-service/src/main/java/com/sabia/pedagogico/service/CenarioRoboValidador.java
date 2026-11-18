package com.sabia.pedagogico.service;

import com.sabia.pedagogico.exception.CenarioInvalidoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Valida o cenarioJson das atividades do modo Jogo do Robô (grade, início, destino, obstáculos,
 * blocos permitidos e existência de caminho do início ao destino). Chaves extras são ignoradas.
 */
@Component
@RequiredArgsConstructor
public class CenarioRoboValidador {

    private static final int TAMANHO_MAXIMO_BYTES = 10 * 1024;
    private static final int GRADE_MIN = 3;
    private static final int GRADE_MAX = 10;
    private static final Set<String> BLOCOS_CONHECIDOS = Set.of("robo_mover", "robo_repetir");

    private final ObjectMapper objectMapper;

    public JsonNode ler(String cenarioJson) {
        if (cenarioJson.getBytes(StandardCharsets.UTF_8).length > TAMANHO_MAXIMO_BYTES) {
            throw new CenarioInvalidoException("O cenário excede o tamanho máximo de 10 KB.");
        }
        try {
            return objectMapper.readTree(cenarioJson);
        } catch (JacksonException e) {
            throw new CenarioInvalidoException("O cenário não é um JSON válido.");
        }
    }

    public void validar(String cenarioJson) {
        JsonNode cenario = ler(cenarioJson);
        Grade grade = lerGrade(cenario);

        JsonNode blocos = cenario.get("blocosPermitidos");
        if (blocos == null || !blocos.isArray() || blocos.isEmpty()) {
            throw new CenarioInvalidoException("O campo 'blocosPermitidos' do cenário deve ser uma lista não vazia.");
        }
        for (JsonNode bloco : blocos) {
            if (!bloco.isString() || !BLOCOS_CONHECIDOS.contains(bloco.stringValue())) {
                throw new CenarioInvalidoException("'blocosPermitidos' aceita apenas robo_mover e robo_repetir.");
            }
        }

        JsonNode maxBlocos = cenario.get("maxBlocos");
        if (maxBlocos != null && !maxBlocos.isNull()
                && (!maxBlocos.isIntegralNumber() || !maxBlocos.canConvertToInt() || maxBlocos.intValue() < 1)) {
            throw new CenarioInvalidoException("O campo 'maxBlocos' do cenário deve ser um inteiro positivo.");
        }

        if (menorCaminho(grade) < 0) {
            throw new CenarioInvalidoException("O cenário não tem caminho do início ao destino.");
        }
    }

    /**
     * Menor número de passos (movimentos de uma casa em 4 direções) do início ao destino, desviando
     * dos obstáculos; -1 se não houver caminho. Lança {@link CenarioInvalidoException} se a forma
     * do cenário (grade, posições, obstáculos) for inválida.
     */
    public int menorCaminho(String cenarioJson) {
        return menorCaminho(lerGrade(cenarioJson));
    }

    /**
     * Grade do cenário (tamanho, início, destino e obstáculos) com as mesmas checagens de forma de
     * {@link #validar}; lança {@link CenarioInvalidoException} se a forma for inválida. Usado pelo
     * simulador do robô.
     */
    public Grade lerGrade(String cenarioJson) {
        return lerGrade(ler(cenarioJson));
    }

    /** Busca em largura na grade, a partir do início. */
    private int menorCaminho(Grade grade) {
        int[][] distancia = new int[grade.linhas()][grade.colunas()];
        for (int[] linha : distancia) {
            Arrays.fill(linha, -1);
        }
        ArrayDeque<Posicao> fila = new ArrayDeque<>();
        distancia[grade.inicio().linha()][grade.inicio().coluna()] = 0;
        fila.add(grade.inicio());
        int[][] direcoes = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        while (!fila.isEmpty()) {
            Posicao atual = fila.poll();
            int passos = distancia[atual.linha()][atual.coluna()];
            if (atual.equals(grade.destino())) {
                return passos;
            }
            for (int[] d : direcoes) {
                Posicao vizinha = new Posicao(atual.linha() + d[0], atual.coluna() + d[1]);
                if (vizinha.linha() < 0 || vizinha.linha() >= grade.linhas()
                        || vizinha.coluna() < 0 || vizinha.coluna() >= grade.colunas()
                        || grade.obstaculos().contains(vizinha)
                        || distancia[vizinha.linha()][vizinha.coluna()] >= 0) {
                    continue;
                }
                distancia[vizinha.linha()][vizinha.coluna()] = passos + 1;
                fila.add(vizinha);
            }
        }
        return -1;
    }

    /** Valida a forma do cenário (objeto, versão, grade, início, destino e obstáculos). */
    private Grade lerGrade(JsonNode cenario) {
        if (cenario == null || !cenario.isObject()) {
            throw new CenarioInvalidoException("O cenário deve ser um objeto JSON.");
        }

        int versao = inteiro(cenario, "versao");
        if (versao < 1) {
            throw new CenarioInvalidoException("O campo 'versao' do cenário deve ser maior que zero.");
        }

        int linhas = inteiro(cenario, "linhas");
        int colunas = inteiro(cenario, "colunas");
        if (linhas < GRADE_MIN || linhas > GRADE_MAX || colunas < GRADE_MIN || colunas > GRADE_MAX) {
            throw new CenarioInvalidoException("A grade do cenário deve ter entre 3 e 10 linhas e colunas.");
        }

        Posicao inicio = posicao(cenario.get("inicio"), "inicio", linhas, colunas);
        Posicao destino = posicao(cenario.get("destino"), "destino", linhas, colunas);
        if (inicio.equals(destino)) {
            throw new CenarioInvalidoException("O início e o destino do cenário devem ser diferentes.");
        }

        JsonNode obstaculos = cenario.get("obstaculos");
        if (obstaculos == null || !obstaculos.isArray()) {
            throw new CenarioInvalidoException("O campo 'obstaculos' do cenário deve ser uma lista.");
        }
        Set<Posicao> posicoesObstaculos = new HashSet<>();
        for (JsonNode obstaculo : obstaculos) {
            Posicao pos = posicao(obstaculo, "obstaculos", linhas, colunas);
            if (pos.equals(inicio) || pos.equals(destino)) {
                throw new CenarioInvalidoException("Obstáculos não podem ficar no início nem no destino.");
            }
            if (!posicoesObstaculos.add(pos)) {
                throw new CenarioInvalidoException("Há obstáculos repetidos.");
            }
        }
        return new Grade(linhas, colunas, inicio, destino, posicoesObstaculos);
    }

    private int inteiro(JsonNode no, String campo) {
        JsonNode valor = no.get(campo);
        if (valor == null || !valor.isIntegralNumber() || !valor.canConvertToInt()) {
            throw new CenarioInvalidoException("O campo '" + campo + "' do cenário deve ser um número inteiro.");
        }
        return valor.intValue();
    }

    private Posicao posicao(JsonNode no, String campo, int linhas, int colunas) {
        if (no == null || !no.isObject()) {
            throw new CenarioInvalidoException("O campo '" + campo + "' do cenário deve ter linha e coluna.");
        }
        int linha = inteiro(no, "linha");
        int coluna = inteiro(no, "coluna");
        if (linha < 0 || linha >= linhas || coluna < 0 || coluna >= colunas) {
            throw new CenarioInvalidoException("O campo '" + campo + "' do cenário está fora da grade.");
        }
        return new Posicao(linha, coluna);
    }

    public record Posicao(int linha, int coluna) {}

    public record Grade(int linhas, int colunas, Posicao inicio, Posicao destino, Set<Posicao> obstaculos) {}
}
