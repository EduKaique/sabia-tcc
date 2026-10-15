package com.sabia.auth.exception;

/** Falha ao falar com o Serviço Pedagógico (indisponível, timeout, 5xx ou resposta inesperada). */
public class PedagogicoIndisponivelException extends RuntimeException {
    public PedagogicoIndisponivelException(Throwable causa) {
        super("Não foi possível concluir agora. Tente novamente.", causa);
    }
}
