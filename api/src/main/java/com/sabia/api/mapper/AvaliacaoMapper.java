package com.sabia.api.mapper;

import com.sabia.api.dto.response.AvaliacaoResponse;
import com.sabia.api.model.atividade.Avaliacao;

import org.mapstruct.Mapper;

@Mapper
public interface AvaliacaoMapper {
    AvaliacaoResponse toResponse(Avaliacao avaliacao);
}
