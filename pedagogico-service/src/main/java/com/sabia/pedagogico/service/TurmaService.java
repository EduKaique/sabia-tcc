package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.TurmaRequest;
import com.sabia.pedagogico.dto.response.TurmaResponse;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TurmaService {

    private static final String ALFABETO_CODIGO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int TAMANHO_CODIGO = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AtividadeAvaliativaRepository atividadeAvaliativaRepository;

    public List<TurmaResponse> listarDoProfessor(Long professorId) {
        return turmaRepository.findByProfessorId(professorId).stream()
                .map(TurmaResponse::from)
                .toList();
    }

    @Transactional
    public TurmaResponse criar(Long professorId, TurmaRequest request) {
        Turma turma = Turma.builder()
                .professorId(professorId)
                .codigoConvite(gerarCodigoConviteUnico())
                .build();
        aplicar(turma, request);
        return TurmaResponse.from(turmaRepository.save(turma));
    }

    @Transactional
    public TurmaResponse atualizar(Long professorId, Long id, TurmaRequest request) {
        Turma turma = buscarDoProfessor(professorId, id);
        aplicar(turma, request);
        return TurmaResponse.from(turma);
    }

    @Transactional
    public void excluir(Long professorId, Long id) {
        Turma turma = buscarDoProfessor(professorId, id);
        long alunos = turmaAlunoRepository.countByTurmaId(id);
        long atividades = atividadeAvaliativaRepository.countByTurmaId(id);
        if (alunos > 0 || atividades > 0) {
            throw new ConflitoException("Não é possível excluir a turma: existem " + alunos
                    + " alunos e " + atividades + " atividades vinculados.");
        }
        turmaRepository.delete(turma);
    }

    private Turma buscarDoProfessor(Long professorId, Long id) {
        // Turma de outro professor responde 404 para não revelar sua existência.
        return turmaRepository.findByIdAndProfessorId(id, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada."));
    }

    private void aplicar(Turma turma, TurmaRequest request) {
        turma.setNome(request.nome().trim());
        turma.setEtapa(request.etapa());
        turma.setAnoSerie(request.anoSerie().trim());
        turma.setTurno(request.turno());
    }

    private String gerarCodigoConviteUnico() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder(TAMANHO_CODIGO);
            for (int i = 0; i < TAMANHO_CODIGO; i++) {
                sb.append(ALFABETO_CODIGO.charAt(RANDOM.nextInt(ALFABETO_CODIGO.length())));
            }
            codigo = sb.toString();
        } while (turmaRepository.existsByCodigoConvite(codigo));
        return codigo;
    }
}
