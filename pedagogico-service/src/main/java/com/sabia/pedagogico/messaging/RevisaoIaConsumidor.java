package com.sabia.pedagogico.messaging;

import com.sabia.pedagogico.exception.SubmissaoNaoEncontradaException;
import com.sabia.pedagogico.messaging.contrato.EnvelopeEvento;
import com.sabia.pedagogico.messaging.contrato.Eventos;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Guarda na submissão o relatório de revisão gerado de forma assíncrona pelo ia-service. */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabia.mensageria.rabbitmq-enabled", havingValue = "true", matchIfMissing = true)
public class RevisaoIaConsumidor {

    static final String CONSUMIDOR = "pedagogico.revisao-ia";

    private final ProcessadorIdempotente processador;
    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = MensageriaTopologia.FILA_REVISAO_IA)
    public void aoReceber(EnvelopeEvento<Eventos.RevisaoIaGerada> evento) throws Exception {
        try (var ignored = EnvelopeValidador.abrirContexto(evento)) {
            if (evento.payload().submissaoId() == null) {
                throw EnvelopeValidador.invalido("payload de revisão sem submissaoId");
            }
            processador.processar(CONSUMIDOR, evento, this::salvar);
        }
    }

    /** Mesmo formato do relatório devolvido pelo endpoint síncrono de revisão. */
    private record Relatorio(String resumo, java.math.BigDecimal notaSugerida, java.util.List<String> acertos,
                             java.util.List<Eventos.RevisaoIaGerada.Erro> erros) {}

    private void salvar(Eventos.RevisaoIaGerada revisao) {
        var submissao = submissaoRepository.findById(revisao.submissaoId())
                .orElseThrow(() -> new SubmissaoNaoEncontradaException(revisao.submissaoId()));
        if (submissao.getRelatorioIaPreGeradoJson() != null) {
            log.info("Submissão id={} já possui relatório de IA; evento ignorado", revisao.submissaoId());
            return;
        }
        var relatorio = new Relatorio(revisao.resumo(), revisao.notaSugerida(), revisao.acertos(), revisao.erros());
        submissao.setRelatorioIaPreGeradoJson(objectMapper.writeValueAsString(relatorio));
        submissaoRepository.save(submissao);
        log.info("Relatório de IA registrado na submissão id={}", revisao.submissaoId());
    }
}
