package com.sabia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.api.model.usuario.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
}
