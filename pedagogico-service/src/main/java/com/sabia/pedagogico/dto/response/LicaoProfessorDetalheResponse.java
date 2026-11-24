package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicao;

import java.time.LocalDateTime;
import java.util.List;

/** Detalhe da lição para o dono. Único lugar da API que devolve o gabarito dos questionários. */
public record LicaoProfessorDetalheResponse(
        Long id,
        EstadoLicao estado,
        String titulo,
        String conceito,
        String resumo,
        ModoAtividade modo,
        String cenarioJson,
        List<Long> turmaIds,
        List<PaginaLicaoResponse> paginas,
        LocalDateTime publicadaEm,
        LocalDateTime criadaEm,
        LocalDateTime atualizadaEm
) {}
