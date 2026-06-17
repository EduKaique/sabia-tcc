package com.sabia.api.service;

import com.sabia.api.dto.request.CriarAtividadeRequest;
import com.sabia.api.dto.request.EditarAtividadeRequest;
import com.sabia.api.dto.response.AtividadeResponse;
import com.sabia.api.exception.AcessoNegadoException;
import com.sabia.api.exception.AtividadeNaoEncontradaException;
import com.sabia.api.exception.OperacaoInvalidaException;
import com.sabia.api.mapper.AtividadeMapper;
import com.sabia.api.model.atividade.AtividadeAvaliativa;
import com.sabia.api.model.atividade.StatusAtividade;
import com.sabia.api.repository.AtividadeAvaliativaRepository;
import com.sabia.api.repository.TurmaAlunoRepository;
import com.sabia.api.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AtividadeService {

    private final AtividadeAvaliativaRepository atividadeRepository;
    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AtividadeMapper atividadeMapper;

    // --------- PROFESSOR ---------

    public List<AtividadeResponse> listarDosProfessor(Long professorId, Long turmaId, StatusAtividade status) {
        List<AtividadeAvaliativa> resultado;
        if (turmaId != null && status != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndTurmaIdAndStatus(professorId, turmaId, status);
        } else if (turmaId != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndTurmaId(professorId, turmaId);
        } else if (status != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndStatus(professorId, status);
        } else {
            resultado = atividadeRepository.findByTurma_ProfessorId(professorId);
        }
        return atividadeMapper.toResponseList(resultado);
    }

    @Transactional
    public AtividadeResponse criar(Long professorId, CriarAtividadeRequest request) {
        var turma = turmaRepository.findById(request.turmaId())
                .orElseThrow(() -> new OperacaoInvalidaException("Turma não encontrada."));

        if (!turma.getProfessor().getId().equals(professorId)) {
            throw new AcessoNegadoException("Esta turma não pertence ao seu perfil.");
        }

        var atividade = AtividadeAvaliativa.builder()
                .turma(turma)
                .titulo(request.titulo())
                .descricao(request.descricao())
                .dataEntrega(request.dataEntrega())
                .pontuacaoMaxima(request.pontuacaoMaxima())
                .build();

        atividade = atividadeRepository.save(atividade);
        log.info("Atividade criada id={} por professor id={}", atividade.getId(), professorId);
        return atividadeMapper.toResponse(atividade);
    }

    public AtividadeResponse buscarParaProfessor(Long professorId, Long atividadeId) {
        return atividadeMapper.toResponse(validarProprietario(professorId, atividadeId));
    }

    @Transactional
    public AtividadeResponse editar(Long professorId, Long atividadeId, EditarAtividadeRequest request) {
        var atividade = validarProprietario(professorId, atividadeId);

        if (request.titulo() != null)         atividade.setTitulo(request.titulo());
        if (request.descricao() != null)      atividade.setDescricao(request.descricao());
        if (request.pontuacaoMaxima() != null) atividade.setPontuacaoMaxima(request.pontuacaoMaxima());
        if (request.dataEntrega() != null)    atividade.setDataEntrega(request.dataEntrega());
        if (request.estadoJson() != null)     atividade.setEstadoJson(request.estadoJson());

        return atividadeMapper.toResponse(atividadeRepository.save(atividade));
    }

    @Transactional
    public AtividadeResponse publicar(Long professorId, Long atividadeId) {
        var atividade = validarProprietario(professorId, atividadeId);
        if (atividade.getStatus() == StatusAtividade.PUBLICADA) {
            throw new OperacaoInvalidaException("Atividade já está publicada.");
        }
        atividade.setStatus(StatusAtividade.PUBLICADA);
        log.info("Atividade id={} publicada", atividadeId);
        return atividadeMapper.toResponse(atividadeRepository.save(atividade));
    }

    @Transactional
    public AtividadeResponse despublicar(Long professorId, Long atividadeId) {
        var atividade = validarProprietario(professorId, atividadeId);
        if (atividade.getStatus() == StatusAtividade.RASCUNHO) {
            throw new OperacaoInvalidaException("Atividade já está como rascunho.");
        }
        atividade.setStatus(StatusAtividade.RASCUNHO);
        log.info("Atividade id={} despublicada", atividadeId);
        return atividadeMapper.toResponse(atividadeRepository.save(atividade));
    }

    // --------- ALUNO ---------

    public List<AtividadeResponse> listarPublicadasParaAluno(Long alunoId) {
        List<Long> turmaIds = turmaAlunoRepository.findByAlunoId(alunoId).stream()
                .map(ta -> ta.getTurma().getId())
                .toList();

        if (turmaIds.isEmpty()) return List.of();

        return atividadeMapper.toResponseList(
                atividadeRepository.findByTurmaIdInAndStatus(turmaIds, StatusAtividade.PUBLICADA));
    }

    public AtividadeResponse buscarParaAluno(Long alunoId, Long atividadeId) {
        var atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AtividadeNaoEncontradaException(atividadeId));

        if (atividade.getStatus() != StatusAtividade.PUBLICADA) {
            throw new AcessoNegadoException("Esta atividade não está disponível.");
        }
        if (!turmaAlunoRepository.existsByTurmaIdAndAlunoId(atividade.getTurma().getId(), alunoId)) {
            throw new AcessoNegadoException("Você não está matriculado nesta turma.");
        }
        return atividadeMapper.toResponse(atividade);
    }

    // --------- helpers ---------

    private AtividadeAvaliativa validarProprietario(Long professorId, Long atividadeId) {
        var atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AtividadeNaoEncontradaException(atividadeId));
        if (!atividade.getTurma().getProfessor().getId().equals(professorId)) {
            throw new AcessoNegadoException("Esta atividade não pertence ao seu perfil.");
        }
        return atividade;
    }
}
