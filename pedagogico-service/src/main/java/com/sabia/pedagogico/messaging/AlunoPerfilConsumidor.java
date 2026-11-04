package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import com.sabia.pedagogico.messaging.contrato.Eventos;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Mantém os nomes copiados de alunos (snapshots) em dia com o auth-service. */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "true", matchIfMissing = true)
public class AlunoPerfilConsumidor {

    static final String CONSUMIDOR = "pedagogico.aluno-perfil";

    private final ProcessadorIdempotente processador;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final SubmissaoAvaliativaRepository submissaoRepository;

    @RabbitListener(queues = MensageriaTopologia.FILA_ALUNO_PERFIL)
    public void aoReceber(EnvelopeEvento<Eventos.AlunoPerfilAtualizado> evento) throws Exception {
        try (var ignored = EnvelopeValidador.abrirContexto(evento)) {
            var payload = evento.payload();
            if (payload == null || payload.alunoId() == null
                    || payload.nomeCompleto() == null || payload.nomeCompleto().isBlank()) {
                throw EnvelopeValidador.invalido("payload de aluno.perfil-atualizado incompleto");
            }
            processador.processar(CONSUMIDOR, evento, this::atualizarNome);
        }
    }

    private void atualizarNome(Eventos.AlunoPerfilAtualizado p) {
        int matriculas = turmaAlunoRepository.atualizarNomeAluno(p.alunoId(), p.nomeCompleto());
        int submissoes = submissaoRepository.atualizarNomeAluno(p.alunoId(), p.nomeCompleto());
        log.info("Nome do aluno id={} atualizado: matriculas={} submissoes={}", p.alunoId(), matriculas, submissoes);
    }
}
