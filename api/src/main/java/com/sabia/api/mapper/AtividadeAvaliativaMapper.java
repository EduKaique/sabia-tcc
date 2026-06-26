package com.sabia.api.mapper;

import com.sabia.api.dto.response.AtividadeAvaliativaProfessorResponse;
import com.sabia.api.model.atividade.AtividadeAvaliativa;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, unmappedSourcePolicy = ReportingPolicy.IGNORE)
public interface AtividadeAvaliativaMapper {

    @Mapping(target = "turmaId", source = "turma.id")
    AtividadeAvaliativaProfessorResponse toProfessorResponse(AtividadeAvaliativa atividade);

    List<AtividadeAvaliativaProfessorResponse> toProfessorResponseList(List<AtividadeAvaliativa> atividades);
}
