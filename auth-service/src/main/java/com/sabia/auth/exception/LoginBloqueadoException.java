package com.sabia.auth.exception;

/** Login bloqueado temporariamente por excesso de tentativas erradas na mesma conta. */
public class LoginBloqueadoException extends RuntimeException {

    private final long segundosRestantes;

    public LoginBloqueadoException(long segundosRestantes) {
        super("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        this.segundosRestantes = segundosRestantes;
    }

    public long getSegundosRestantes() {
        return segundosRestantes;
    }
}
