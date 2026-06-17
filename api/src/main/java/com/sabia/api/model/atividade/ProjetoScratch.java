package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.sabia.api.model.usuario.Aluno;

@Entity
@Table(name = "projeto_scratch")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjetoScratch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Column(columnDefinition = "TEXT")
    private String estadoJson;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
