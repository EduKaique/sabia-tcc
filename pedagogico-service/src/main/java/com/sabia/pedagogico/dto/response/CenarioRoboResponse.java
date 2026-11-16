package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.robo.CenarioRobo;

import java.time.LocalDateTime;

public record CenarioRoboResponse(
        Long id,
        String nome,
        String cenarioJson,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public static CenarioRoboResponse from(CenarioRobo c) {
        return new CenarioRoboResponse(c.getId(), c.getNome(), c.getCenarioJson(), c.getCriadoEm(),
                c.getAtualizadoEm());
    }
}
