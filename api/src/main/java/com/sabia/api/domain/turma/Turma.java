package com.sabia.api.domain.turma;

import com.sabia.api.domain.institution.Instituicao;
import com.sabia.api.domain.user.Professor;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "turma")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professor_id", nullable = false)
    private Professor professor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instituicao_id")
    private Instituicao instituicao;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @PrePersist
    void prePersist() {
        criadaEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
