package com.sabia.api.repository;

import com.sabia.api.domain.turma.Turma;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TurmaRepository extends JpaRepository<Turma, UUID> {
    List<Turma> findByProfessorId(UUID professorId);
}
