package com.sabia.auth.model.usuario;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.sabia.auth.model.instituicao.Instituicao;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "usuario")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instituicao_id")
    private Instituicao instituicao;

    @Column(nullable = false)
    private String nome;

    // Opcional só para ALUNO (primeiro acesso por convite); obrigatório para os demais perfis,
    // garantido em validarCpfObrigatorio(). Bancos existentes: ver ALTER no data.sql.
    @Column(unique = true, length = 11)
    private String cpf;

    private LocalDate dataNascimento;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PerfilUsuario tipoPerfil;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean mustChangePassword = false;

    @PrePersist
    void prePersist() {
        validarCpfObrigatorio();
        criadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    void preUpdate() {
        validarCpfObrigatorio();
    }

    private void validarCpfObrigatorio() {
        if (tipoPerfil != PerfilUsuario.ALUNO && (cpf == null || cpf.isBlank())) {
            throw new IllegalStateException("CPF é obrigatório para o perfil " + tipoPerfil + ".");
        }
    }

    // --- UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + tipoPerfil.name()));
    }

    @Override
    public String getPassword() {
        return senhaHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
