package com.sabia.pedagogico.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.pedagogico.model.turma.Turma;

import java.util.List;
import java.util.Optional;

public interface TurmaRepository extends JpaRepository<Turma, Long> {
    List<Turma> findByProfessorId(Long professorId);
    Optional<Turma> findByIdAndProfessorId(Long id, Long professorId);
    boolean existsByCodigoConvite(String codigoConvite);
}
