package com.sabia.pedagogico.dto;

import com.sabia.pedagogico.dto.request.AvaliarSubmissaoRequest;
import com.sabia.pedagogico.dto.request.CriarAtividadeAvaliativaRequest;
import com.sabia.pedagogico.dto.request.EditarAtividadeRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Bean Validation dos DTOs de nota e pontuação máxima (viram 400 com campos no GlobalExceptionHandler). */
class ValidacaoNotaEPontuacaoTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private static Set<String> campos(Set<? extends ConstraintViolation<?>> violacoes) {
        return violacoes.stream().map(v -> v.getPropertyPath().toString()).collect(java.util.stream.Collectors.toSet());
    }

    private Set<String> validarNota(String nota) {
        return campos(validator.validate(new AvaliarSubmissaoRequest(new BigDecimal(nota), "ok")));
    }

    @Test
    void notaNegativaOuComTresCasasEhInvalida() {
        assertThat(validarNota("-1")).containsExactly("nota");
        assertThat(validarNota("8.555")).containsExactly("nota");
    }

    @Test
    void mensagensDeValidacaoSaoEmPortugues() {
        var mensagens = validator.validate(new AvaliarSubmissaoRequest(new BigDecimal("8.555"), "ok")).stream()
                .map(ConstraintViolation::getMessage).toList();
        assertThat(mensagens).containsExactly("Use no máximo 2 casas decimais.");
        var maximo = validator.validate(criar(101)).stream().map(ConstraintViolation::getMessage).toList();
        assertThat(maximo).containsExactly("A pontuação máxima deve ficar entre 1 e 100.");
    }

    @Test
    void notaValidaPassaNoDto() {
        assertThat(validarNota("0")).isEmpty();
        assertThat(validarNota("8.55")).isEmpty();
        assertThat(validarNota("100")).isEmpty();
    }

    @Test
    void pontuacaoMaximaDeCriacaoVaiDe1a100() {
        assertThat(campos(validator.validate(criar(101)))).containsExactly("pontuacaoMaxima");
        assertThat(campos(validator.validate(criar(0)))).containsExactly("pontuacaoMaxima");
        assertThat(validator.validate(criar(100))).isEmpty();
    }

    @Test
    void pontuacaoMaximaDeEdicaoVaiDe1a100() {
        assertThat(campos(validator.validate(editar(101)))).containsExactly("pontuacaoMaxima");
        assertThat(validator.validate(editar(100))).isEmpty();
        assertThat(validator.validate(editar(null))).isEmpty();
    }

    private static CriarAtividadeAvaliativaRequest criar(int pontuacaoMaxima) {
        return new CriarAtividadeAvaliativaRequest("Título", null, null, 1L, pontuacaoMaxima, null, null, null, null);
    }

    private static EditarAtividadeRequest editar(Integer pontuacaoMaxima) {
        return new EditarAtividadeRequest(null, null, pontuacaoMaxima, null, null, null, null);
    }
}
