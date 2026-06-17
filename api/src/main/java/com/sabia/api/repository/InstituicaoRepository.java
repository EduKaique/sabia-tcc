package com.sabia.api.repository;

import com.sabia.api.domain.institution.Instituicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InstituicaoRepository extends JpaRepository<Instituicao, UUID> {}
