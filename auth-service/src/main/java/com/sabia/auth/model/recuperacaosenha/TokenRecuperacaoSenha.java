package com.sabia.auth.model.recuperacaosenha;

import com.sabia.auth.model.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "token_recuperacao_senha")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TokenRecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "hash_token", nullable = false, unique = true)
    private String hashToken;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
