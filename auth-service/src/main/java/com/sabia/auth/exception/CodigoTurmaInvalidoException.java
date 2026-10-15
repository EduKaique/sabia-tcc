package com.sabia.auth.exception;

/** Mesma mensagem da validação pública do código (pedagogico, GET /api/publico/convites). */
public class CodigoTurmaInvalidoException extends RuntimeException {
    public CodigoTurmaInvalidoException() {
        super("Código de turma inválido. Verifique com seu professor.");
    }
}
