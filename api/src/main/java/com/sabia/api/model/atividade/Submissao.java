package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.sabia.api.model.usuario.Aluno;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public abstract class Submissao {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataEnvio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusSubmissao status = StatusSubmissao.PENDENTE;

    @PrePersist
    void prePersist() {
        dataEnvio = LocalDateTime.now(ZoneOffset.UTC);
    }
}
