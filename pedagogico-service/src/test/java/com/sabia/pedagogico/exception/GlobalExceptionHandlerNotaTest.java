package com.sabia.pedagogico.exception;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerNotaTest {

    @Test
    void notaInvalidaViraBadRequestComCampoNota() {
        var resposta = new GlobalExceptionHandler()
                .handleNotaInvalida(new NotaInvalidaException("A nota deve ficar entre 0 e 10."));

        assertThat(resposta.getStatusCode().value()).isEqualTo(400);
        var corpo = resposta.getBody();
        assertThat(corpo.status()).isEqualTo(400);
        assertThat(corpo.erro()).isEqualTo("Dados inválidos");
        assertThat(corpo.timestamp()).isNotBlank();
        assertThat(corpo.campos()).isEqualTo(Map.of("nota", "A nota deve ficar entre 0 e 10."));
    }
}
