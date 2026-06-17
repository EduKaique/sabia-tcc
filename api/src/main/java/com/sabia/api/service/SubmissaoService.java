package com.sabia.api.service;

import com.sabia.api.dto.request.AvaliarSubmissaoRequest;
import com.sabia.api.dto.request.SubmeterAtividadeRequest;
import com.sabia.api.dto.response.AvaliacaoResponse;
import com.sabia.api.dto.response.SubmissaoResponse;
import com.sabia.api.exception.AcessoNegadoException;
import com.sabia.api.exception.AtividadeNaoEncontradaException;
import com.sabia.api.exception.OperacaoInvalidaException;
import com.sabia.api.exception.SubmissaoNaoEncontradaException;
import com.sabia.api.mapper.AvaliacaoMapper;
import com.sabia.api.model.atividade.*;
import com.sabia.api.model.usuario.Aluno;
import com.sabia.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SubmissaoService {

    private final SubmissaoRepository submissaoRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final AtividadeAvaliativaRepository atividadeRepository;
    private final AlunoRepository alunoRepository;
    private final ProjetoScratchRepository projetoScratchRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AvaliacaoMapper avaliacaoMapper;

    // --------- ALUNO ---------

    @Transactional
    public SubmissaoResponse submeter(Long alunoId, Long atividadeId, SubmeterAtividadeRequest request) {
        var atividade = atividadeRepository.findById(atividadeId)
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

        var projeto = ProjetoScratch.builder()
                .aluno(aluno)
                .estadoJson(request.estadoJson())
                .build();
        projeto = projetoScratchRepository.save(projeto);

        var submissao = Submissao.builder()
                .atividade(atividade)
                .aluno(aluno)
                .projeto(projeto)
                .build();
        submissao = submissaoRepository.save(submissao);

        log.info("Submissão id={} criada pelo aluno id={}", submissao.getId(), alunoId);
        return toResponse(submissao, null);
    }

    public List<SubmissaoResponse> listarDoAluno(Long alunoId) {
        return submissaoRepository.findByAlunoId(alunoId).stream()
                .map(s -> toResponse(s, avaliacaoRepository.findBySubmissaoId(s.getId()).orElse(null)))
                .toList();
    }

    public SubmissaoResponse buscarDoAluno(Long alunoId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        if (!submissao.getAluno().getId().equals(alunoId)) {
            throw new AcessoNegadoException("Esta submissão não pertence ao seu perfil.");
        }
        return toResponse(submissao, avaliacaoRepository.findBySubmissaoId(submissaoId).orElse(null));
    }

    // --------- PROFESSOR ---------

    public List<SubmissaoResponse> listarPendentesParaProfessor(Long professorId) {
        return submissaoRepository.findByProfessorIdAndStatus(professorId, StatusSubmissao.PENDENTE).stream()
                .map(s -> toResponse(s, null))
                .toList();
    }

    public SubmissaoResponse buscarParaProfessor(Long professorId, Long submissaoId) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);
        return toResponse(submissao, avaliacaoRepository.findBySubmissaoId(submissaoId).orElse(null));
    }

    @Transactional
    public SubmissaoResponse avaliar(Long professorId, Long submissaoId, AvaliarSubmissaoRequest request) {
        var submissao = buscarPorId(submissaoId);
        validarProfessorDaSubmissao(professorId, submissao);

        if (avaliacaoRepository.findBySubmissaoId(submissaoId).isPresent()) {
            throw new OperacaoInvalidaException("Esta submissão já foi avaliada.");
        }

        var avaliacao = Avaliacao.builder()
                .submissao(submissao)
                .nota(request.nota())
                .feedbackProfessor(request.feedbackProfessor())
                .build();
        avaliacao = avaliacaoRepository.save(avaliacao);

        submissao.setStatus(StatusSubmissao.CORRIGIDA);
        submissaoRepository.save(submissao);

        log.info("Submissão id={} avaliada com nota={} pelo professor id={}", submissaoId, request.nota(), professorId);
        return toResponse(submissao, avaliacao);
    }

    // --------- helpers ---------

    private Submissao buscarPorId(Long id) {
        return submissaoRepository.findById(id)
                .orElseThrow(() -> new SubmissaoNaoEncontradaException(id));
    }

    private void validarProfessorDaSubmissao(Long professorId, Submissao submissao) {
        if (!submissao.getAtividade().getTurma().getProfessor().getId().equals(professorId)) {
            throw new AcessoNegadoException("Esta submissão não pertence a uma atividade sua.");
        }
    }

    private SubmissaoResponse toResponse(Submissao submissao, Avaliacao avaliacao) {
        AvaliacaoResponse avaliacaoResponse = avaliacao != null
                ? avaliacaoMapper.toResponse(avaliacao)
                : null;
        return new SubmissaoResponse(
                submissao.getId(),
                submissao.getAtividade().getId(),
                submissao.getDataEnvio(),
                submissao.getStatus(),
                avaliacaoResponse
        );
    }
}
