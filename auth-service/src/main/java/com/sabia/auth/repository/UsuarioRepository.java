package com.sabia.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
    List<Usuario> findByTipoPerfil(PerfilUsuario tipoPerfil);
    List<Usuario> findByTipoPerfilAndAtivo(PerfilUsuario tipoPerfil, boolean ativo);
}
