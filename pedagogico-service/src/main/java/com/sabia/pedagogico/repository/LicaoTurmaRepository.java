package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.LicaoTurma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface LicaoTurmaRepository extends JpaRepository<LicaoTurma, Long> {

    /** Vínculos das lições com a turma já carregada (id e nome), numa consulta. */
    @Query("SELECT lt FROM LicaoTurma lt JOIN FETCH lt.turma WHERE lt.licao.id IN :licaoIds ORDER BY lt.turma.nome")
    List<LicaoTurma> findComTurmaByLicaoIdIn(@Param("licaoIds") Collection<Long> licaoIds);

    List<LicaoTurma> findByLicaoId(Long licaoId);

    @Modifying
    @Query("DELETE FROM LicaoTurma lt WHERE lt.turma.id = :turmaId")
    int deleteByTurmaId(@Param("turmaId") Long turmaId);
}
