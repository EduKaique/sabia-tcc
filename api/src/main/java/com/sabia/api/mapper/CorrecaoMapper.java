package com.sabia.api.mapper;

import com.sabia.api.dto.response.CorrecaoResponse;
import com.sabia.api.model.atividade.Correcao;

import org.mapstruct.Mapper;

@Mapper
public interface CorrecaoMapper {
    CorrecaoResponse toResponse(Correcao correcao);
}
