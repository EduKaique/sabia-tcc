package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.api.model.usuario.Professor;


public interface ProfessorRepository extends JpaRepository<Professor, Long> {}
