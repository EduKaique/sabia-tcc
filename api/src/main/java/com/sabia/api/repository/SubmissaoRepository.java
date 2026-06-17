package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sabia.api.model.atividade.StatusSubmissao;
import com.sabia.api.model.atividade.Submissao;

import java.util.List;

public interface SubmissaoRepository extends JpaRepository<Submissao, Long> {

    boolean existsByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    List<Submissao> findByAlunoId(Long alunoId);

    @Query("""
        SELECT s FROM Submissao s
        WHERE s.atividade.turma.professor.id = :professorId
          AND s.status = :status
        """)
    List<Submissao> findByProfessorIdAndStatus(
            @Param("professorId") Long professorId,
            @Param("status") StatusSubmissao status);
}
