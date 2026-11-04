package com.sabia.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/** {@code senhaTemporaria} só vem no modo ALEATORIA: no modo DIGITADA o professor já a conhece. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SenhaAlunoResponse(String senhaTemporaria, boolean exigirTroca) {

    @Override
    public String toString() {
        return "SenhaAlunoResponse[exigirTroca=" + exigirTroca + ", senhaTemporaria=omitida]";
    }
}
