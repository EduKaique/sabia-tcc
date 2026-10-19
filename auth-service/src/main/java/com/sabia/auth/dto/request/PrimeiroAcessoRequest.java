package com.sabia.auth.dto.request;

import com.sabia.auth.model.usuario.Aluno;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Locale;

/**
 * Cadastro do aluno pelo convite (HU003.2). O aluno não informa CPF nem e-mail: entra pela
 * matrícula. As regras que dependem de contexto (avatar do catálogo, idade máxima, senhas
 * iguais) ficam no PrimeiroAcessoService.
 */
public record PrimeiroAcessoRequest(
        @NotBlank(message = "O código da turma é obrigatório.") String codigoTurma,
        @NotBlank(message = "O nome completo é obrigatório.")
        @Size(max = 255, message = "O nome deve ter no máximo 255 caracteres.") String nomeCompleto,
        @NotBlank(message = "A matrícula é obrigatória.")
        @Size(max = 255, message = "A matrícula deve ter no máximo 255 caracteres.")
        @Pattern(regexp = "^[^@]*$", message = "A matrícula não pode conter @.") String matricula,
        @NotNull(message = "A data de nascimento é obrigatória.")
        @Past(message = "A data de nascimento deve estar no passado.") LocalDate dataNascimento,
        @NotBlank(message = "O avatar é obrigatório.") String avatar,
        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String senha,
        @NotBlank(message = "A confirmação da senha é obrigatória.") String confirmarSenha
) {
    public PrimeiroAcessoRequest {
        codigoTurma = codigoTurma == null ? null : codigoTurma.trim().toUpperCase(Locale.ROOT);
        nomeCompleto = nomeCompleto == null ? null : nomeCompleto.trim();
        matricula = Aluno.normalizarMatricula(matricula);
        avatar = avatar == null ? null : avatar.trim();
    }

    /** Dados pessoais e senha nunca vão para log (ex.: DEBUG do Spring MVC imprime o corpo lido). */
    @Override
    public String toString() {
        return "PrimeiroAcessoRequest[dados omitidos]";
    }
}
