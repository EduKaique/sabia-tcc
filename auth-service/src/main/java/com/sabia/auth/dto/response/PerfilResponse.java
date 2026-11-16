package com.sabia.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Perfil do usuário autenticado. Matrícula e avatar só existem para aluno; CPF não é exposto. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PerfilResponse(
        String nome,
        String email,
        String perfil,
        String matricula,
        String avatar
) {}
