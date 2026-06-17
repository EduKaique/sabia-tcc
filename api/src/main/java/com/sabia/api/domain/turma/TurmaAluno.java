package com.sabia.api.domain.turma;

import com.sabia.api.domain.user.Aluno;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(
    name = "turma_aluno",
    uniqueConstraints = @UniqueConstraint(columnNames = {"turma_id", "aluno_id"})
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TurmaAluno {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Column(nullable = false, updatable = false)
    private LocalDateTime ingressoEm;

    @PrePersist
    void prePersist() {
        ingressoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
