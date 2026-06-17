package com.sabia.api.repository;

import com.sabia.api.domain.user.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AlunoRepository extends JpaRepository<Aluno, UUID> {}
