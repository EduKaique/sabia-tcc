package com.sabia.api.repository;

import com.sabia.api.domain.activity.ProjetoScratch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjetoScratchRepository extends JpaRepository<ProjetoScratch, UUID> {}
