package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.robo.CenarioRobo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CenarioRoboRepository extends JpaRepository<CenarioRobo, Long> {
    List<CenarioRobo> findByProfessorIdOrderByAtualizadoEmDesc(Long professorId);
    Optional<CenarioRobo> findByIdAndProfessorId(Long id, Long professorId);
    long countByProfessorId(Long professorId);
}
