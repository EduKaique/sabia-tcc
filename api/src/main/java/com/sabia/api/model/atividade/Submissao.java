package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.sabia.api.model.usuario.Aluno;

@Entity
@Table(
    name = "submissao",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "atividade_id"})
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Submissao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false, unique = true)
    private ProjetoScratch projeto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_id", nullable = false)
    private AtividadeAvaliativa atividade;

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
