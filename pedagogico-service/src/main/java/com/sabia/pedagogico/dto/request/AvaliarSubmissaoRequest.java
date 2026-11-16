package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AvaliarSubmissaoRequest(
        @NotNull(message = "Informe a nota.")
        @DecimalMin(value = "0", message = "A nota mínima é 0.")
        @Digits(integer = 3, fraction = 2, message = "Use no máximo 2 casas decimais.") BigDecimal nota,
        @NotBlank String feedbackProfessor
) {}
