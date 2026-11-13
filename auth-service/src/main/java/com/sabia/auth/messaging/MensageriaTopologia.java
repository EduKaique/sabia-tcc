package com.sabia.auth.messaging;

/** O auth-service só publica; as filas são declaradas pelos consumidores. */
public final class MensageriaTopologia {

    public static final String EXCHANGE = "sabia.eventos";

    private MensageriaTopologia() {}
}
