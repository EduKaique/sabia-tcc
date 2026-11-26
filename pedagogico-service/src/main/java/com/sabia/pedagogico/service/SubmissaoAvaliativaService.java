package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.AvaliarSubmissaoRequest;
import com.sabia.pedagogico.dto.request.SubmeterAtividadeRequest;
import com.sabia.pedagogico.dto.response.CorrecaoResponse;
import com.sabia.pedagogico.dto.response.PageResponse;
import com.sabia.pedagogico.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.pedagogico.dto.response.SubmissaoListagemResponse;
import com.sabia.pedagogico.dto.response.SubmissaoProfessorDetalheResponse;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.AtividadeNaoEncontradaException;
import com.sabia.pedagogico.exception.NotaInvalidaException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.SubmissaoNaoEncontradaException;
import com.sabia.pedagogico.mapper.CorrecaoMapper;
import com.sabia.pedagogico.messaging.SubmissaoEnviadaEvent;
import com.sabia.pedagogico.model.atividade.*;
import com.sabia.pedagogico.repository.*;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import com.sabia.pedagogico.service.robo.AnaliseRobo;
import com.sabia.pedagogico.service.robo.AnaliseRoboService;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SubmissaoAvaliativaService {

    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final CorrecaoRepository correcaoRepository;
    private final AtividadeAvaliativaRepository atividadeAvaliativaRepository;
    private final ProjetoAvaliativoRepository projetoScratchRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final CorrecaoMapper correcaoMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final ValidadorPratica validadorPratica;
    private final ObjectMapper objectMapper;
    private final AnaliseRoboService analiseRoboService;

    // --------- ALUNO ---------

    @Transactional
    public SubmissaoAvaliativaResponse submeter(Long alunoId, String alunoNome, Long atividadeId, SubmeterAtividadeRequest request) {
        var atividade = atividadeAvaliativaRepository.findById(atividadeId)
                .orElseThrow(() -> new AtividadeNaoEncontradaException(atividadeId));

        if (atividade.getStatus() != StatusAtividade.PUBLICADA) {
            throw new OperacaoInvalidaException("Esta atividade não está disponível para submissão.");
        }
        if (!turmaAlunoRepository.existsByTurmaIdAndAlunoId(atividade.getTurma().getId(), alunoId)) {
            throw new AcessoNegadoException("Você não está matriculado nesta turma.");
        }
        if (submissaoRepository.existsByAlunoIdAndAtividadeId(alunoId, atividadeId)) {
            throw new OperacaoInvalidaException("Você já submeteu esta atividade.");
        }

        // Valida antes de gravar: entrada ilegível vira 400 sem salvar nada; resultado negativo é registrado.
        ResultadoValidacao validacao = validadorPratica.validar(atividade.getModo(), atividade.getCenarioJson(),
                request.estadoJson());

        var projeto = ProjetoAvaliativo.builder()
                .alunoId(alunoId)
                .estadoJson(request.estadoJson())
                .build();
        projeto = projetoScratchRepository.save(projeto);

        var submissao = SubmissaoAvaliativa.builder()
                .atividade(atividade)
                .alunoId(alunoId)
                .alunoNome(alunoNome)
                .projeto(projeto)
                .status(StatusSubmissao.PENDENTE)
                .validacaoJson(objectMapper.writeValueAsString(validacao))
                .build();
        submissao = submissaoRepository.save(submissao);

        // O único consumidor de submissao.enviada é a revisão genérica do ia-service, que não conhece o
        // robô: entregas do robô não publicam o evento (o item 3.5 pode reabrir isso com contextoRobo).
        if (atividade.getModo() != ModoAtividade.JOGO_ROBO) {
            eventPublisher.publishEvent(new SubmissaoEnviadaEvent(submissao.getId()));
        }
        log.info("Submissão id={} criada pelo aluno id={} (prática {})", submissao.getId(), alunoId, validacao.status());
        return toResponse(submissao, null);
    }

    public List<SubmissaoAvaliativaResponse> listarDoAluno(Long alunoId) {
        return submissaoRepository.findByAlunoId(alunoId).stream()
                .map(s -> toResponse(s, s.getCorrecao()))
                .toList();
    }

    public SubmissaoAvaliativaResponse buscarDoAluno(Long alunoId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        if (!submissao.getAlunoId().equals(alunoId)) {
            throw new AcessoNegadoException("Esta submissão não pertence ao seu perfil.");
        }
        return toResponse(submissao, submissao.getCorrecao());
    }

    // --------- PROFESSOR ---------

    public PageResponse<SubmissaoListagemResponse> listarSubmissoesPorAtividade(
            Long atividadeId,
            Long professorId,
            StatusSubmissao status,
            Pageable pageable) {

        var page = submissaoRepository.findByAtividadeIdAndProfessorAndStatus(atividadeId, professorId, status, pageable);
        return PageResponse.from(page.map(this::toListagemResponse));
    }

    public SubmissaoProfessorDetalheResponse buscarParaProfessor(Long professorId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);

        var projeto = submissao.getProjeto();
        var correcao = submissao.getCorrecao();
        return new SubmissaoProfessorDetalheResponse(
                submissao.getId(),
                submissao.getAtividade().getId(),
                submissao.getAlunoNome(),
                submissao.getEnviadaEm(),
                submissao.getStatus(),
                projeto != null ? projeto.getEstadoJson() : null,
                correcao != null ? correcaoMapper.toResponse(correcao) : null,
                submissao.getRelatorioIaPreGeradoJson(),
                lerValidacao(submissao),
                analisarRobo(submissao, projeto != null ? projeto.getEstadoJson() : null)
        );
    }

    /** Análise do programa do robô; nula fora do modo robô e se cenário ou estado não forem legíveis. */
    private AnaliseRobo analisarRobo(SubmissaoAvaliativa submissao, String estadoJson) {
        var atividade = submissao.getAtividade();
        if (atividade.getModo() != ModoAtividade.JOGO_ROBO || estadoJson == null) {
            return null;
        }
        try {
            return analiseRoboService.analisar(atividade.getCenarioJson(), estadoJson);
        } catch (RuntimeException e) {
            log.warn("Análise do robô indisponível na submissão id={}", submissao.getId());
            return null;
        }
    }

    /** Resultado gravado na entrega; nulo para entregas antigas ou se o registro não for legível. */
    private ResultadoValidacao lerValidacao(SubmissaoAvaliativa submissao) {
        String json = submissao.getValidacaoJson();
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, ResultadoValidacao.class);
        } catch (JacksonException e) {
            log.warn("validacao_json ilegível na submissão id={}", submissao.getId());
            return null;
        }
    }

    @Transactional
    public SubmissaoAvaliativaResponse corrigir(Long professorId, Long submissaoId, AvaliarSubmissaoRequest request) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);

        if (submissao.getCorrecao() != null) {
            throw new OperacaoInvalidaException("Esta submissão já foi avaliada.");
        }
        int maxima = submissao.getAtividade().getPontuacaoMaxima();
        if (request.nota().compareTo(BigDecimal.valueOf(maxima)) > 0) {
            throw new NotaInvalidaException("A nota deve ficar entre 0 e " + maxima + ".");
        }

        var correcao = Correcao.builder()
                .submissao(submissao)
                .nota(request.nota())
                .feedbackProfessor(request.feedbackProfessor())
                .build();
        correcao = correcaoRepository.save(correcao);

        submissao.setStatus(StatusSubmissao.CORRIGIDA);
        submissaoRepository.save(submissao);

        log.info("Submissão id={} avaliada com nota={} pelo professor id={}", submissaoId, request.nota(), professorId);
        return toResponse(submissao, correcao);
    }

    // --------- helpers ---------

    private SubmissaoAvaliativa buscarPorId(Long id) {
        return submissaoRepository.findById(id)
                .orElseThrow(() -> new SubmissaoNaoEncontradaException(id));
    }

    private void validarProfessorDaSubmissao(Long professorId, SubmissaoAvaliativa submissao) {
        if (!submissao.getAtividade().getTurma().getProfessorId().equals(professorId)) {
            throw new AcessoNegadoException("Esta submissão não pertence a uma atividade sua.");
        }
    }

    private SubmissaoAvaliativaResponse toResponse(SubmissaoAvaliativa submissao, Correcao correcao) {
        CorrecaoResponse CorrecaoResponse = correcao != null
                ? correcaoMapper.toResponse(correcao)
                : null;
        return new SubmissaoAvaliativaResponse(
                submissao.getId(),
                submissao.getAtividade().getId(),
                submissao.getEnviadaEm(),
                submissao.getStatus(),
                CorrecaoResponse
        );
    }

    private SubmissaoListagemResponse toListagemResponse(SubmissaoAvaliativa submissao) {
        var atividade = submissao.getAtividade();
        var correcao = submissao.getCorrecao();

        boolean entregueComAtraso = atividade.getDataEntrega() != null
                && submissao.getEnviadaEm().isAfter(atividade.getDataEntrega());

        var nota = correcao != null ? correcao.getNota() : null;

        // alunoNome é um snapshot capturado do JWT do aluno no momento da submissão
        // (submeter(...)) — submissões anteriores a essa mudança ficam null.
        return new SubmissaoListagemResponse(
                submissao.getId(),
                submissao.getAlunoId(),
                submissao.getAlunoNome(),
                null,
                null,
                entregueComAtraso,
                submissao.getStatus(),
                nota,
                submissao.getEnviadaEm()
        );
    }
}
