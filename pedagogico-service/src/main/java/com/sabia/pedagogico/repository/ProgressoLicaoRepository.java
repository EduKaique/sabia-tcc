package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.ProgressoLicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressoLicaoRepository extends JpaRepository<ProgressoLicao, Long> {

    Optional<ProgressoLicao> findByAlunoIdAndLicaoId(Long alunoId, Long licaoId);

    List<ProgressoLicao> findByAlunoId(Long alunoId);
}
