package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.function.Consumer;

/**
 * Executa o tratamento de um evento no máximo uma vez por consumidor: o registro de
 * "processada" e o efeito de negócio compartilham a mesma transação. Entregas duplicadas
 * (redelivery, republicação) são descartadas; se duas chegarem juntas, a PK rejeita a segunda
 * e o retry do listener a reconhece como duplicada.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProcessadorIdempotente {

    private final MensagemProcessadaRepository repository;

    @Transactional
    public <T> boolean processar(String consumidor, EnvelopeEvento<T> evento, Consumer<T> tratamento) {
        var registro = MensagemProcessada.de(consumidor, evento.messageId());
        if (repository.existsById(registro.getId())) {
            log.info("Mensagem duplicada descartada: consumidor={} messageId={}", consumidor, evento.messageId());
            return false;
        }
        repository.saveAndFlush(registro);
        tratamento.accept(evento.payload());
        return true;
    }
}
