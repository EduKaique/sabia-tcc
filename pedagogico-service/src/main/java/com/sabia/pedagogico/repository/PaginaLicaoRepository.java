package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.PaginaLicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PaginaLicaoRepository extends JpaRepository<PaginaLicao, Long> {

    List<PaginaLicao> findByLicaoIdOrderByOrdemAsc(Long licaoId);

    /** Pares [licaoId, quantidade de páginas]; lição sem páginas não aparece. */
    @Query("SELECT p.licao.id, COUNT(p) FROM PaginaLicao p WHERE p.licao.id IN :licaoIds GROUP BY p.licao.id")
    List<Object[]> contarPorLicao(@Param("licaoIds") Collection<Long> licaoIds);
}
