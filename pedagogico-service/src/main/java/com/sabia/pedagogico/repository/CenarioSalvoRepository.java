package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.robo.CenarioSalvo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CenarioSalvoRepository extends JpaRepository<CenarioSalvo, Long> {
    List<CenarioSalvo> findByProfessorIdOrderByAtualizadoEmDesc(Long professorId);
    Optional<CenarioSalvo> findByIdAndProfessorId(Long id, Long professorId);
    long countByProfessorId(Long professorId);
}
