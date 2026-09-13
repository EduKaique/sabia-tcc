package com.sabia.pedagogico.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.pedagogico.model.atividade.Correcao;

import java.util.Optional;

public interface CorrecaoRepository extends JpaRepository<Correcao, Long> {
    Optional<Correcao> findBySubmissaoId(Long submissaoId);
}
