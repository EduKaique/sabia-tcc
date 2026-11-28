package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoPublicacaoLicao;

import java.time.LocalDateTime;
import java.util.List;

/** Detalhe da lição para o dono. Único lugar da API que devolve o gabarito dos questionários. */
public record LicaoProfessorDetalheResponse(
        Long id,
        EstadoPublicacaoLicao estado,
        String titulo,
        String conceito,
        String resumo,
        ModoPratica modo,
        String cenarioJson,
        List<Long> turmaIds,
        List<PaginaLicaoResponse> paginas,
        LocalDateTime publicadaEm,
        LocalDateTime criadaEm,
        LocalDateTime atualizadaEm
) {}
