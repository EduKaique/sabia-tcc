package com.sabia.api.service;

import com.sabia.api.dto.request.AvaliarSubmissaoRequest;
import com.sabia.api.dto.request.SubmeterAtividadeRequest;
import com.sabia.api.dto.response.CorrecaoResponse;
import com.sabia.api.dto.response.PageResponse;
import com.sabia.api.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.api.dto.response.SubmissaoListagemResponse;
import com.sabia.api.exception.AcessoNegadoException;
import com.sabia.api.exception.AtividadeNaoEncontradaException;
import com.sabia.api.exception.OperacaoInvalidaException;
import com.sabia.api.exception.SubmissaoNaoEncontradaException;
import com.sabia.api.mapper.CorrecaoMapper;
import com.sabia.api.model.atividade.*;
import com.sabia.api.model.usuario.Aluno;
import com.sabia.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SubmissaoAvaliativaService {

    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final CorrecaoRepository correcaoRepository;
    private final AtividadeAvaliativaRepository atividadeAvaliativaRepository;
    private final AlunoRepository alunoRepository;
    private final ProjetoAvaliativoRepository projetoScratchRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final CorrecaoMapper correcaoMapper;

    // --------- ALUNO ---------

    @Transactional
    public SubmissaoAvaliativaResponse submeter(Long alunoId, Long atividadeId, SubmeterAtividadeRequest request) {
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

        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new AcessoNegadoException("Aluno não encontrado."));

        var projeto = ProjetoAvaliativo.builder()
                .aluno(aluno)
                .estadoJson(request.estadoJson())
                .build();
        projeto = projetoScratchRepository.save(projeto);

        var submissao = SubmissaoAvaliativa.builder()
                .atividade(atividade)
                .aluno(aluno)
                .projeto(projeto)
                .status(StatusSubmissao.PENDENTE)
                .build();
        submissao = submissaoRepository.save(submissao);

        log.info("Submissão id={} criada pelo aluno id={}", submissao.getId(), alunoId);
        return toResponse(submissao, null);
    }

    public List<SubmissaoAvaliativaResponse> listarDoAluno(Long alunoId) {
        return submissaoRepository.findByAlunoId(alunoId).stream()
                .map(s -> toResponse(s, s.getCorrecao()))
                .toList();
    }

    public SubmissaoAvaliativaResponse buscarDoAluno(Long alunoId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        if (!submissao.getAluno().getId().equals(alunoId)) {
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

    public SubmissaoAvaliativaResponse buscarParaProfessor(Long professorId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);
        return toResponse(submissao, submissao.getCorrecao());
    }

    @Transactional
    public SubmissaoAvaliativaResponse corrigir(Long professorId, Long submissaoId, AvaliarSubmissaoRequest request) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);

        if (submissao.getCorrecao() != null) {
            throw new OperacaoInvalidaException("Esta submissão já foi avaliada.");
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
        if (!submissao.getAtividade().getTurma().getProfessor().getId().equals(professorId)) {
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
                submissao.getDataEnvio(),
                submissao.getStatus(),
                CorrecaoResponse
        );
    }

    private SubmissaoListagemResponse toListagemResponse(SubmissaoAvaliativa submissao) {
        var atividade = submissao.getAtividade();
        var aluno = submissao.getAluno();
        var correcao = submissao.getCorrecao();

        boolean entregueComAtraso = atividade.getDataEntrega() != null
                && submissao.getDataEnvio().isAfter(atividade.getDataEntrega());

        var nota = correcao != null ? correcao.getNota() : null;

        return new SubmissaoListagemResponse(
                submissao.getId(),
                aluno.getId(),
                aluno.getUsuario().getNome(),
                null,
                null,
                entregueComAtraso,
                submissao.getStatus(),
                nota,
                submissao.getDataEnvio()
        );
    }
}
