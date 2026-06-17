package com.sabia.api.mapper;

import com.sabia.api.domain.activity.Avaliacao;
import com.sabia.api.dto.response.AvaliacaoResponse;
import org.mapstruct.Mapper;

@Mapper
public interface AvaliacaoMapper {
    AvaliacaoResponse toResponse(Avaliacao avaliacao);
}
