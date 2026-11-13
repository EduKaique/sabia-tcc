package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.Eventos;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;

/**
 * Publica {@code submissao.enviada} somente depois do commit, para o consumidor nunca ver uma
 * submissão que acabou sofrendo rollback. Se a publicação falhar, o fluxo síncrono de revisão
 * por IA (sob demanda) continua disponível; um outbox seria a evolução para garantia total.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubmissaoEventosPublisher {

    private final EventoPublisher publisher;
    private final SubmissaoAvaliativaRepository submissaoRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void aposCommit(SubmissaoEnviadaEvent evento) {
        try {
            var s = submissaoRepository.findById(evento.submissaoId()).orElse(null);
            if (s == null) {
                return;
            }
            var a = s.getAtividade();
            publisher.publicar(Eventos.SUBMISSAO_ENVIADA, new Eventos.SubmissaoEnviada(
                    s.getId(), a.getId(), s.getAlunoId(),
                    new Eventos.SubmissaoEnviada.Atividade(a.getTitulo(), a.getDescricao(),
                            BigDecimal.valueOf(a.getPontuacaoMaxima()), a.getGabaritoEstadoJson()),
                    s.getProjeto().getEstadoJson()));
        } catch (RuntimeException e) {
            log.error("Não foi possível montar o evento submissao.enviada da submissão id={}: {}",
                    evento.submissaoId(), e.getMessage());
        }
    }
}
