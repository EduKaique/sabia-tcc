package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "avaliacao")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submissao_id", nullable = false, unique = true)
    private Submissao submissao;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal nota;

    @Column(columnDefinition = "TEXT")
    private String feedbackProfessor;

    @Column(columnDefinition = "TEXT")
    private String relatorioIaJson;

    @Column(nullable = false, updatable = false)
    private LocalDateTime avaliadaEm;

    @PrePersist
    void prePersist() {
        avaliadaEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
