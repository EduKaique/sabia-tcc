package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.api.model.instituicao.Instituicao;


public interface InstituicaoRepository extends JpaRepository<Instituicao, Long> {}
