package com.sabia.pedagogico.mapper;

import com.sabia.pedagogico.dto.response.CorrecaoResponse;
import com.sabia.pedagogico.model.atividade.Correcao;

import org.mapstruct.Mapper;

@Mapper
public interface CorrecaoMapper {
    CorrecaoResponse toResponse(Correcao correcao);
}
