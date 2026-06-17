package com.sabia.api.repository;

import com.sabia.api.domain.activity.StatusSubmissao;
import com.sabia.api.domain.activity.Submissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SubmissaoRepository extends JpaRepository<Submissao, UUID> {

    boolean existsByAlunoIdAndAtividadeId(UUID alunoId, UUID atividadeId);

    List<Submissao> findByAlunoId(UUID alunoId);

    @Query("""
        SELECT s FROM Submissao s
        WHERE s.atividade.turma.professor.id = :professorId
          AND s.status = :status
        """)
    List<Submissao> findByProfessorIdAndStatus(
            @Param("professorId") UUID professorId,
            @Param("status") StatusSubmissao status);
}
