package com.sabia.auth.messaging;

import com.sabia.auth.messaging.contrato.Eventos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Publica o evento só depois do commit: consumidores nunca veem um perfil que sofreu rollback. */
@Component
@RequiredArgsConstructor
public class PerfilEventosPublisher {

    private final EventoPublisher publisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aposCommit(PerfilAlunoAtualizadoEvent evento) {
        publisher.publicar(Eventos.ALUNO_PERFIL_ATUALIZADO,
                new Eventos.AlunoPerfilAtualizado(evento.alunoId(), evento.nomeCompleto()));
    }
}
