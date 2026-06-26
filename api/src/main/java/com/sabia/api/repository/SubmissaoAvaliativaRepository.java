package com.sabia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sabia.api.model.atividade.StatusSubmissao;
import com.sabia.api.model.atividade.SubmissaoAvaliativa;

import java.util.List;
import java.util.Optional;

public interface SubmissaoAvaliativaRepository extends JpaRepository<SubmissaoAvaliativa, Long> {

    boolean existsByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    Optional<SubmissaoAvaliativa> findByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    List<SubmissaoAvaliativa> findByAlunoId(Long alunoId);

    @Query("""
        SELECT s FROM SubmissaoAvaliativa s
        WHERE s.atividade.id = :atividadeId
          AND s.atividade.turma.professor.id = :professorId
          AND (:status IS NULL OR s.status = :status)
        """)
    Page<SubmissaoAvaliativa> findByAtividadeIdAndProfessorAndStatus(
            @Param("atividadeId") Long atividadeId,
            @Param("professorId") Long professorId,
            @Param("status") StatusSubmissao status,
            Pageable pageable);
}
