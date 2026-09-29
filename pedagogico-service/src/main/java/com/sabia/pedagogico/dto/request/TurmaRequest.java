package com.sabia.pedagogico.dto.request;

import com.sabia.pedagogico.model.turma.EtapaEnsino;
import com.sabia.pedagogico.model.turma.Turno;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TurmaRequest(
        @NotBlank(message = "O nome da turma é obrigatório.") String nome,
        @NotNull(message = "A modalidade de ensino é obrigatória.") EtapaEnsino etapa,
        @NotBlank(message = "O ano/série é obrigatório.") String anoSerie,
        @NotNull(message = "O turno é obrigatório.") Turno turno
) {}
