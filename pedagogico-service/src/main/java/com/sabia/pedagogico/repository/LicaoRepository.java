package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LicaoRepository extends JpaRepository<Licao, Long> {

    List<Licao> findByStatusOrderByOrdemAsc(StatusLicao status);

    Optional<Licao> findByIdAndStatus(Long id, StatusLicao status);
}
