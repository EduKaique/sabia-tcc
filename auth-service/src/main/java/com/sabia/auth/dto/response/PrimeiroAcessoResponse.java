package com.sabia.auth.dto.response;

/** Mesmos campos do {@link LoginResponse}, mais a turma em que o aluno acabou de entrar. */
public record PrimeiroAcessoResponse(
        String token,
        String tipo,
        String perfil,
        String nome,
        boolean mustChangePassword,
        Turma turma
) {
    public record Turma(String nome) {}

    public static PrimeiroAcessoResponse of(LoginResponse login, String turmaNome) {
        return new PrimeiroAcessoResponse(login.token(), login.tipo(), login.perfil(), login.nome(),
                login.mustChangePassword(), new Turma(turmaNome));
    }
}
