package com.sabia.pedagogico.messaging;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Registro de mensagens já tratadas por um consumidor (idempotência). */
@Entity
@Table(name = "evento_consumido")
@Getter @NoArgsConstructor @AllArgsConstructor
public class MensagemProcessada {

    /** {@code consumidor:messageId} */
    @Id
    @Column(length = 200)
    private String id;

    @Column(nullable = false)
    private Instant processadaEm;

    public static MensagemProcessada de(String consumidor, String messageId) {
        return new MensagemProcessada(consumidor + ":" + messageId, Instant.now());
    }
}
