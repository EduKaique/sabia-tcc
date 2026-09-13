package com.sabia.pedagogico.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.pedagogico.model.turma.TurmaAluno;

import java.util.List;

public interface TurmaAlunoRepository extends JpaRepository<TurmaAluno, Long> {
    List<TurmaAluno> findByAlunoId(Long alunoId);
    boolean existsByTurmaIdAndAlunoId(Long turmaId, Long alunoId);
}
