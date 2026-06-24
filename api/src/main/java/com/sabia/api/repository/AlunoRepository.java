package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.api.model.usuario.Aluno;


public interface AlunoRepository extends JpaRepository<Aluno, Long> {}
