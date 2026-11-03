package com.sabia.auth.service.senha;

import java.util.List;

/**
 * Palavras das senhas automáticas: substantivos comuns, de 3 a 5 letras, minúsculas e sem
 * acento, que uma criança lê e digita sem dificuldade. Lista curada: ficam de fora palavras
 * usadas como xingamento ou apelido em sala (ex.: vaca, burro, anta, porco, mico, perua,
 * pinto, lula, rato). Ao incluir palavras, manter essas regras.
 */
final class PalavrasSenha {

    static final List<String> FRUTAS = List.of(
            "uva", "kiwi", "caju", "pera", "coco", "lima", "figo", "amora", "manga", "jaca", "cacau");

    static final List<String> ANIMAIS = List.of(
            "gato", "pato", "lobo", "urso", "foca", "sapo", "tatu", "galo", "peixe", "zebra", "tigre",
            "coala", "panda", "lhama", "arara", "cervo", "pombo", "polvo", "siri", "ganso", "cabra");

    static final List<String> OBJETOS_E_CORES = List.of(
            "bola", "sol", "lua", "mar", "flor", "nuvem", "verde", "azul", "roxo", "rosa", "mel",
            "pipa", "dado", "sino", "barco", "trem", "chave", "livro", "vela");

    static final List<String> TODAS = java.util.stream.Stream.of(FRUTAS, ANIMAIS, OBJETOS_E_CORES)
            .flatMap(List::stream)
            .toList();

    private PalavrasSenha() {}
}
