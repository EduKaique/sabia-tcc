package com.sabia.pedagogico.model.licao;

import com.sabia.pedagogico.model.turma.Turma;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Vínculo N:N entre lição e turma do mesmo professor. */
@Entity
@Table(
    name = "licao_turma",
    uniqueConstraints = @UniqueConstraint(columnNames = {"licao_id", "turma_id"}),
    indexes = @Index(name = "idx_licao_turma_turma", columnList = "turma_id")
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LicaoTurma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licao_id", nullable = false)
    private Licao licao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @Column(name = "vinculada_em", nullable = false)
    private LocalDateTime vinculadaEm;
}
