package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.api.model.atividade.AtividadeAvaliativa;
import com.sabia.api.model.atividade.StatusAtividade;

import java.util.List;

public interface AtividadeAvaliativaRepository extends JpaRepository<AtividadeAvaliativa, Long> {

    List<AtividadeAvaliativa> findByTurma_ProfessorId(Long professorId);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndTurmaId(Long professorId, Long turmaId);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndStatus(Long professorId, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndTurmaIdAndStatus(Long professorId, Long turmaId, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurmaIdInAndStatus(List<Long> turmaIds, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurmaIdIn(List<Long> turmaIds);
}
