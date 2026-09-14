package com.sabia.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.auth.model.recuperacaosenha.TokenRecuperacaoSenha;

import java.util.List;
import java.util.Optional;

public interface TokenRecuperacaoSenhaRepository extends JpaRepository<TokenRecuperacaoSenha, Long> {
    Optional<TokenRecuperacaoSenha> findByHashToken(String hashToken);
    List<TokenRecuperacaoSenha> findByUsuarioIdAndUsadoEmIsNullAndIdNot(Long usuarioId, Long id);
}
