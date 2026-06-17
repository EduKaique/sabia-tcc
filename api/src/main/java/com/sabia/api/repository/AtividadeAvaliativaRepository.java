package com.sabia.api.repository;

import com.sabia.api.domain.activity.AtividadeAvaliativa;
import com.sabia.api.domain.activity.StatusAtividade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AtividadeAvaliativaRepository extends JpaRepository<AtividadeAvaliativa, UUID> {

    List<AtividadeAvaliativa> findByTurma_ProfessorId(UUID professorId);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndTurmaId(UUID professorId, UUID turmaId);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndStatus(UUID professorId, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurma_ProfessorIdAndTurmaIdAndStatus(UUID professorId, UUID turmaId, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurmaIdInAndStatus(List<UUID> turmaIds, StatusAtividade status);

    List<AtividadeAvaliativa> findByTurmaIdIn(List<UUID> turmaIds);
}
