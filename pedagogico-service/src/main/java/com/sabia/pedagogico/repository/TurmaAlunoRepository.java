package com.sabia.pedagogico.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.pedagogico.model.turma.TurmaAluno;

import java.util.List;
import java.util.Optional;

public interface TurmaAlunoRepository extends JpaRepository<TurmaAluno, Long> {
    List<TurmaAluno> findByAlunoId(Long alunoId);
    boolean existsByTurmaIdAndAlunoId(Long turmaId, Long alunoId);
    long countByTurmaId(Long turmaId);
    List<TurmaAluno> findByTurmaIdOrderByIngressoEmDesc(Long turmaId);
    Optional<TurmaAluno> findByTurmaIdAndAlunoId(Long turmaId, Long alunoId);
}
