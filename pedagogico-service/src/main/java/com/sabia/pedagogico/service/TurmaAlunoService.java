package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.MatricularAlunoRequest;
import com.sabia.pedagogico.dto.response.TurmaAlunoResponse;
import com.sabia.pedagogico.dto.response.TurmaDoAlunoResponse;
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
    private static final String MSG_JA_POSSUI_TURMA =
            "Você já está em uma turma. Fale com seu professor se precisar trocar.";

    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final TurmaService turmaService;

    public List<TurmaAlunoResponse> listar(Long professorId, Long turmaId) {
        buscarDoProfessor(professorId, turmaId);
        return turmaAlunoRepository.findByTurmaIdOrderByIngressoEmDesc(turmaId).stream()
                .map(TurmaAlunoResponse::from)
                .toList();
    }

    @Transactional
    public TurmaAlunoResponse matricular(Long professorId, Long turmaId, MatricularAlunoRequest request) {
        return vincular(buscarDoProfessor(professorId, turmaId), request);
    }

    /** Matrícula feita pelo auth-service no primeiro acesso do aluno: sem checagem de professor. */
    @Transactional
    public TurmaAlunoResponse matricularPeloSistema(Long turmaId, MatricularAlunoRequest request) {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada."));
        return vincular(turma, request);
    }

    public List<TurmaDoAlunoResponse> listarDoAluno(Long alunoId) {
        return turmaAlunoRepository.findByAlunoId(alunoId).stream()
                .map(m -> TurmaDoAlunoResponse.from(m.getTurma()))
                .toList();
    }

    /**
     * Aluno já cadastrado entra numa turma pelo código de convite. Só vale para quem ainda
     * não tem turma; a troca de turma continua com o professor.
     */
    @Transactional
    public TurmaDoAlunoResponse entrarPorCodigo(Long alunoId, String alunoNome, String codigo) {
        Turma turma = turmaService.buscarPorCodigoConvite(codigo);
        if (!turmaAlunoRepository.findByAlunoId(alunoId).isEmpty()) {
            throw new ConflitoException(MSG_JA_POSSUI_TURMA);
        }
        vincular(turma, new MatricularAlunoRequest(alunoId, alunoNome));
        return TurmaDoAlunoResponse.from(turma);
    }

    private TurmaAlunoResponse vincular(Turma turma, MatricularAlunoRequest request) {
        if (turmaAlunoRepository.existsByTurmaIdAndAlunoId(turma.getId(), request.alunoId())) {
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
