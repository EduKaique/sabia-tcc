package com.sabia.pedagogico.dto.response;

/**
 * Resposta pública da validação do código de convite: só o necessário para a tela de
 * convite (sem ids, professor, instituição ou contagem de alunos).
 */
public record ConviteValidoResponse(String codigo, String turmaNome) {
}
