package com.sabia.pedagogico.dto.response;

/** Resposta interna (auth-service → pedagogico) da busca de turma pelo código de convite. */
public record TurmaPorCodigoResponse(Long turmaId, String turmaNome) {
}
