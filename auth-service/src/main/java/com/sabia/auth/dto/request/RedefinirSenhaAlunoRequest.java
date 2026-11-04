package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * Redefinição da senha do aluno pelo professor. {@code senha} só é usada no modo DIGITADA;
 * as regras de tamanho ficam no serviço, para a mensagem de erro nunca repetir o valor.
 */
public record RedefinirSenhaAlunoRequest(
        @NotNull(message = "Informe o modo de redefinição.") Modo modo,
        String senha,
        boolean exigirTroca
) {
    public enum Modo { ALEATORIA, DIGITADA }

    /** A senha nunca vai para log (ex.: DEBUG do Spring MVC imprime o corpo lido). */
    @Override
    public String toString() {
        return "RedefinirSenhaAlunoRequest[modo=" + modo + ", exigirTroca=" + exigirTroca + ", senha=omitida]";
    }
}
