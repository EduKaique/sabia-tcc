package com.sabia.pedagogico.mapper;

import com.sabia.pedagogico.dto.response.AtividadeAvaliativaProfessorResponse;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, unmappedSourcePolicy = ReportingPolicy.IGNORE)
public interface AtividadeAvaliativaMapper {

    @Mapping(target = "turmaId", source = "atividade.turma.id")
    @Mapping(target = "modo", source = "atividade.modo", defaultValue = "BLOCOS")
    @Mapping(target = "possuiNotas", source = "possuiNotas")
    AtividadeAvaliativaProfessorResponse toProfessorResponse(AtividadeAvaliativa atividade, boolean possuiNotas);
}
