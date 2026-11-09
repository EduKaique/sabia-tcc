package com.sabia.pedagogico.model.licao;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(
    name = "progresso_licao",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "licao_id"})
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProgressoLicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licao_id", nullable = false)
    private Licao licao;

    @Column(nullable = false)
    @Builder.Default
    private boolean videoVisto = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean atividadeConcluida = false;

    @Column(columnDefinition = "TEXT")
    private String estadoJson;

    private LocalDateTime concluidaEm;

    @Column(nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    void tocar() {
        atualizadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
