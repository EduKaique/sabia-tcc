package com.sabia.auth.service.senha;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Senha temporária fácil de ditar para crianças: 1 ou 2 palavras de {@link PalavrasSenha} +
 * 2 dígitos de 2 a 9 (sem 0 e 1, confundidos com "o" e "l"). Ex.: gato42, uvapato73.
 * Resultado sempre com 6 a 10 caracteres; fora disso, sorteia de novo.
 * Nunca logar o valor gerado.
 */
@Component
public class GeradorSenhaAmigavel {

    static final int TAMANHO_MINIMO = 6;
    static final int TAMANHO_MAXIMO = 10;
    private static final String DIGITOS = "23456789";
    private static final Pattern FORMATO = Pattern.compile("^[a-z]+[2-9]{2}$");
    private static final SecureRandom RANDOM = new SecureRandom();

    public String gerar() {
        List<String> palavras = PalavrasSenha.TODAS;
        while (true) {
            StringBuilder sb = new StringBuilder();
            int quantidade = 1 + RANDOM.nextInt(2);
            for (int i = 0; i < quantidade; i++) {
                sb.append(palavras.get(RANDOM.nextInt(palavras.size())));
            }
            sb.append(DIGITOS.charAt(RANDOM.nextInt(DIGITOS.length())));
            sb.append(DIGITOS.charAt(RANDOM.nextInt(DIGITOS.length())));
            String senha = sb.toString();
            if (senha.length() >= TAMANHO_MINIMO && senha.length() <= TAMANHO_MAXIMO
                    && FORMATO.matcher(senha).matches()) {
                return senha;
            }
        }
    }
}
