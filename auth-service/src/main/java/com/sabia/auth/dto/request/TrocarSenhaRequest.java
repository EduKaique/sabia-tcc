package com.sabia.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TrocarSenhaRequest(
        @NotBlank String senhaAtual,
        @NotBlank @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String novaSenha,
        @NotBlank String confirmarSenha
) {
    /** Senhas nunca vão para log (o DEBUG do Spring MVC no perfil dev imprime o corpo lido). */
    @Override
    public String toString() {
        return "TrocarSenhaRequest[senhas omitidas]";
    }
}
