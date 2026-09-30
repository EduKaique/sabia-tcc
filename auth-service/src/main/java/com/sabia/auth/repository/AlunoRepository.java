package com.sabia.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.auth.model.usuario.Aluno;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    boolean existsByMatriculaAndIdNot(String matricula, Long id);
}
