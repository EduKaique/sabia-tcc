package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import jakarta.validation.constraints.Null;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.sabia.api.model.turma.Turma;

@Entity
@Table(name = "atividade_avaliativa")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AtividadeAvaliativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private LocalDateTime dataEntrega;

    @Column(nullable = false)
    private int pontuacaoMaxima;

    @Column(nullable = false)
    @Builder.Default
    private boolean eGeradaIa = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusAtividade status = StatusAtividade.RASCUNHO;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String gabaritoEstadoJson;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @PrePersist
    void prePersist() {
        criadaEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
