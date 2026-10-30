package com.sabia.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.auth.model.usuario.Professor;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {
}
