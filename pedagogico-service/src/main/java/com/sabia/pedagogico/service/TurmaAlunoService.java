package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.MatricularAlunoRequest;
import com.sabia.pedagogico.dto.response.TurmaAlunoResponse;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TurmaAlunoService {

    private static final String MSG_JA_MATRICULADO = "Aluno já está matriculado nesta turma.";

    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;

    public List<TurmaAlunoResponse> listar(Long professorId, Long turmaId) {
        buscarDoProfessor(professorId, turmaId);
        return turmaAlunoRepository.findByTurmaIdOrderByIngressoEmDesc(turmaId).stream()
                .map(TurmaAlunoResponse::from)
                .toList();
    }

    @Transactional
    public TurmaAlunoResponse matricular(Long professorId, Long turmaId, MatricularAlunoRequest request) {
        Turma turma = buscarDoProfessor(professorId, turmaId);
        if (turmaAlunoRepository.existsByTurmaIdAndAlunoId(turmaId, request.alunoId())) {
            throw new ConflitoException(MSG_JA_MATRICULADO);
        }
        TurmaAluno matricula = TurmaAluno.builder()
                .turma(turma)
                .alunoId(request.alunoId())
                .alunoNome(request.alunoNome().trim())
                .build();
        try {
            return TurmaAlunoResponse.from(turmaAlunoRepository.saveAndFlush(matricula));
        } catch (DataIntegrityViolationException e) {
            // Corrida entre duas matrículas simultâneas do mesmo aluno (unique turma_id + aluno_id).
            throw new ConflitoException(MSG_JA_MATRICULADO);
        }
    }

    @Transactional
    public void desmatricular(Long professorId, Long turmaId, Long alunoId) {
        buscarDoProfessor(professorId, turmaId);
        TurmaAluno matricula = turmaAlunoRepository.findByTurmaIdAndAlunoId(turmaId, alunoId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não está matriculado nesta turma."));
        turmaAlunoRepository.delete(matricula);
    }

    private Turma buscarDoProfessor(Long professorId, Long turmaId) {
        return turmaRepository.findByIdAndProfessorId(turmaId, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada."));
    }
}
