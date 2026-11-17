package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LicaoRepository extends JpaRepository<Licao, Long> {

    List<Licao> findByStatusOrderByOrdemAsc(StatusLicao status);

    Optional<Licao> findByIdAndStatus(Long id, StatusLicao status);

    List<Licao> findByProfessorIdAndStatusOrderByAtualizadaEmDesc(Long professorId, StatusLicao status);

    @Query("SELECT DISTINCT lt.licao FROM LicaoTurma lt WHERE lt.licao.professorId = :professorId "
            + "AND lt.licao.status = :status AND lt.turma.id = :turmaId ORDER BY lt.licao.atualizadaEm DESC")
    List<Licao> findDoProfessorPorTurma(@Param("professorId") Long professorId, @Param("status") StatusLicao status,
                                        @Param("turmaId") Long turmaId);

    long countByProfessorIdAndStatus(Long professorId, StatusLicao status);
}
