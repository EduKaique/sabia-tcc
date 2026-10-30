package com.sabia.auth.dto.response;

import com.sabia.auth.model.usuario.Usuario;

public record ProfessorResponse(
        Long id,
        String nome,
        String cpf,
        String email,
        boolean ativo,
        boolean mustChangePassword
) {
    public static ProfessorResponse from(Usuario usuario) {
        return new ProfessorResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.isAtivo(),
                usuario.isMustChangePassword()
        );
    }
}
