package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.ProgressoLicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProgressoLicaoRepository extends JpaRepository<ProgressoLicao, Long> {

    Optional<ProgressoLicao> findByAlunoIdAndLicaoId(Long alunoId, Long licaoId);

    @Query("SELECT p FROM ProgressoLicao p WHERE p.alunoId = :alunoId AND p.licao.id IN :licaoIds")
    List<ProgressoLicao> findByAlunoIdAndLicaoIdIn(@Param("alunoId") Long alunoId,
                                                   @Param("licaoIds") Collection<Long> licaoIds);

    /** Relatório da lição (professor): progresso dos alunos das turmas vinculadas, numa consulta. */
    @Query("SELECT p FROM ProgressoLicao p WHERE p.licao.id = :licaoId AND p.alunoId IN :alunoIds")
    List<ProgressoLicao> findByLicaoIdAndAlunoIdIn(@Param("licaoId") Long licaoId,
                                                   @Param("alunoIds") Collection<Long> alunoIds);
}
