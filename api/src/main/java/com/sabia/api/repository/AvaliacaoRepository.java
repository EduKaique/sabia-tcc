package com.sabia.api.repository;

import com.sabia.api.domain.activity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {
    Optional<Avaliacao> findBySubmissaoId(UUID submissaoId);
}
