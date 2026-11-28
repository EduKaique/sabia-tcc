package com.sabia.pedagogico.dto.response;

import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;

import java.time.LocalDateTime;
import java.util.List;

/** GET /api/aluno/licoes/{id}: montado campo a campo, sem o gabarito dos questionários. */
public record LicaoDetalheResponse(
        Long id,
        String titulo,
        String conceito,
        String resumo,
        ModoPratica modo,
        String cenarioJson,
        String estadoJson,
        boolean atividadeConcluida,
        LocalDateTime concluidaEm,
        EstadoLicaoAluno estado,
        boolean praticaLiberada,
        List<PaginaAlunoResponse> paginas
) {}
