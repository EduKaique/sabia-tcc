package com.sabia.pedagogico.repository;

import com.sabia.pedagogico.model.licao.ProgressoPagina;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProgressoPaginaRepository extends JpaRepository<ProgressoPagina, Long> {

    /**
     * Cria a linha vazia se ainda não existe. Duas requisições simultâneas (duas abas) podem tentar criar a
     * mesma linha; o ON CONFLICT faz a segunda virar no-op em vez de violar o UNIQUE, o que abortaria a
     * transação no Postgres (e uma nova tentativa na mesma transação não funcionaria).
     */
    @Modifying
    @Query(value = "INSERT INTO progresso_pagina (aluno_id, pagina_id) VALUES (:alunoId, :paginaId) "
            + "ON CONFLICT (aluno_id, pagina_id) DO NOTHING", nativeQuery = true)
    int criarSeAusente(@Param("alunoId") Long alunoId, @Param("paginaId") Long paginaId);

    /** Lê a linha com SELECT ... FOR UPDATE: pulsos e envios concorrentes da mesma página são serializados. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pp FROM ProgressoPagina pp WHERE pp.alunoId = :alunoId AND pp.pagina.id = :paginaId")
    Optional<ProgressoPagina> buscarParaAtualizar(@Param("alunoId") Long alunoId, @Param("paginaId") Long paginaId);

    @Query("SELECT pp FROM ProgressoPagina pp WHERE pp.alunoId = :alunoId AND pp.pagina.id IN :paginaIds")
    List<ProgressoPagina> findByAlunoIdAndPaginaIdIn(@Param("alunoId") Long alunoId,
                                                     @Param("paginaIds") Collection<Long> paginaIds);

    /** Relatório da lição (professor): progresso dos alunos das turmas vinculadas nas páginas, numa consulta. */
    @Query("SELECT pp FROM ProgressoPagina pp WHERE pp.pagina.id IN :paginaIds AND pp.alunoId IN :alunoIds")
    List<ProgressoPagina> findByPaginaIdInAndAlunoIdIn(@Param("paginaIds") Collection<Long> paginaIds,
                                                       @Param("alunoIds") Collection<Long> alunoIds);

    /** O professor apagou páginas: o progresso delas sai antes (FK). */
    @Modifying
    @Query("DELETE FROM ProgressoPagina pp WHERE pp.pagina.id IN :paginaIds")
    int deleteByPaginaIdIn(@Param("paginaIds") Collection<Long> paginaIds);
}
