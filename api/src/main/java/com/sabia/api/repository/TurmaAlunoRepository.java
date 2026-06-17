package com.sabia.api.repository;

import com.sabia.api.domain.turma.TurmaAluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TurmaAlunoRepository extends JpaRepository<TurmaAluno, UUID> {
    List<TurmaAluno> findByAlunoId(UUID alunoId);
    boolean existsByTurmaIdAndAlunoId(UUID turmaId, UUID alunoId);
}
