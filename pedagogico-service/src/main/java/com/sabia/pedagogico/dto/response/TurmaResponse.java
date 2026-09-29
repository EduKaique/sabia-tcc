package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.turma.EtapaEnsino;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.Turno;

public record TurmaResponse(
        Long id,
        String nome,
        EtapaEnsino etapa,
        String anoSerie,
        Turno turno,
        String codigoConvite
) {
    public static TurmaResponse from(Turma t) {
        return new TurmaResponse(t.getId(), t.getNome(), t.getEtapa(), t.getAnoSerie(), t.getTurno(),
                t.getCodigoConvite());
    }
}
