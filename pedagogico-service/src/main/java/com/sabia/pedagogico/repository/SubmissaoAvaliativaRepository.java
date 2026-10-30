package com.sabia.pedagogico.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissaoAvaliativaRepository extends JpaRepository<SubmissaoAvaliativa, Long> {

    boolean existsByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    boolean existsByAtividadeId(Long atividadeId);

    Optional<SubmissaoAvaliativa> findByAlunoIdAndAtividadeId(Long alunoId, Long atividadeId);

    List<SubmissaoAvaliativa> findByAlunoId(Long alunoId);

    List<SubmissaoAvaliativa> findByAtividade_Turma_ProfessorId(Long professorId);

    List<SubmissaoAvaliativa> findByAtividade_IdIn(Collection<Long> atividadeIds);

    @Query("""
        SELECT s FROM SubmissaoAvaliativa s
        WHERE s.atividade.id = :atividadeId
          AND s.atividade.turma.professorId = :professorId
          AND (:status IS NULL OR s.status = :status)
        """)
    Page<SubmissaoAvaliativa> findByAtividadeIdAndProfessorAndStatus(
            @Param("atividadeId") Long atividadeId,
            @Param("professorId") Long professorId,
            @Param("status") StatusSubmissao status,
            Pageable pageable);
}
