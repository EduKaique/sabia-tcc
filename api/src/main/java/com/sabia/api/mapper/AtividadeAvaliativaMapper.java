package com.sabia.api.mapper;

import com.sabia.api.dto.response.AtividadeAvaliativaResponse;
import com.sabia.api.model.atividade.AtividadeAvaliativa;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface AtividadeAvaliativaMapper {

    @Mapping(target = "turmaId", source = "turma.id")
    AtividadeAvaliativaResponse toResponse(AtividadeAvaliativa atividade);

    List<AtividadeAvaliativaResponse> toResponseList(List<AtividadeAvaliativa> atividades);
}
