package com.sabia.api.mapper;

import com.sabia.api.dto.response.AtividadeResponse;
import com.sabia.api.model.atividade.AtividadeAvaliativa;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface AtividadeMapper {

    @Mapping(target = "turmaId", source = "turma.id")
    AtividadeResponse toResponse(AtividadeAvaliativa atividade);

    List<AtividadeResponse> toResponseList(List<AtividadeAvaliativa> atividades);
}
