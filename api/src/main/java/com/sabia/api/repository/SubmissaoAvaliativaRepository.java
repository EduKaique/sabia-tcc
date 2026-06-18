package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sabia.api.model.atividade.StatusSubmissao;
import com.sabia.api.model.atividade.SubmissaoAvaliativa;

import java.util.List;

public interface SubmissaoAvaliativaRepository extends JpaRepository<SubmissaoAvaliativa, Long> {

    boolean existsByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    List<SubmissaoAvaliativa> findByAlunoId(Long alunoId);

    @Query("""
        SELECT s FROM SubmissaoAvaliativa s
        WHERE s.atividade.turma.professor.id = :professorId
          AND s.status = :status
        """)
    List<SubmissaoAvaliativa> findByProfessorIdAndStatus(
            @Param("professorId") Long professorId,
            @Param("status") StatusSubmissao status);
}
