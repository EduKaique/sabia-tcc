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

    /** Painel do professor: progresso de todos os alunos matriculados na turma nessas lições, numa consulta. */
    @Query("SELECT p FROM ProgressoLicao p WHERE p.licao.id IN :licaoIds "
            + "AND p.alunoId IN (SELECT ta.alunoId FROM TurmaAluno ta WHERE ta.turma.id = :turmaId)")
    List<ProgressoLicao> findDaTurmaPorLicoes(@Param("turmaId") Long turmaId,
                                              @Param("licaoIds") Collection<Long> licaoIds);
}
