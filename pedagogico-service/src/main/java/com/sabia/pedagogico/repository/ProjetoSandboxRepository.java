package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.sandbox.ProjetoSandbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjetoSandboxRepository extends JpaRepository<ProjetoSandbox, Long> {
    List<ProjetoSandbox> findByAlunoIdOrderByAtualizadoEmDesc(Long alunoId);
    Optional<ProjetoSandbox> findByIdAndAlunoId(Long id, Long alunoId);
    long countByAlunoId(Long alunoId);
}
