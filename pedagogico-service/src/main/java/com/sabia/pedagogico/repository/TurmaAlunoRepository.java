package com.sabia.pedagogico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sabia.pedagogico.model.turma.TurmaAluno;

import java.util.List;
import java.util.Optional;

public interface TurmaAlunoRepository extends JpaRepository<TurmaAluno, Long> {
    List<TurmaAluno> findByAlunoId(Long alunoId);
    List<TurmaAluno> findByTurmaId(Long turmaId);
    boolean existsByTurmaIdAndAlunoId(Long turmaId, Long alunoId);
    long countByTurmaId(Long turmaId);
    List<TurmaAluno> findByTurmaIdOrderByIngressoEmDesc(Long turmaId);
    Optional<TurmaAluno> findByTurmaIdAndAlunoId(Long turmaId, Long alunoId);

    @Modifying
    @Query("UPDATE TurmaAluno ta SET ta.alunoNome = :nome WHERE ta.alunoId = :alunoId")
    int atualizarNomeAluno(@Param("alunoId") Long alunoId, @Param("nome") String nome);
}
