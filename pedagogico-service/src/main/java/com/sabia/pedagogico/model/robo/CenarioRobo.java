package com.sabia.pedagogico.model.robo;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Cenário do Jogo do Robô salvo na biblioteca de um professor. As atividades copiam o cenarioJson
 * (snapshot) e não dependem desta linha: editar ou excluir o cenário não altera atividades.
 */
@Entity
@Table(name = "cenario_robo")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CenarioRobo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "professor_id", nullable = false)
    private Long professorId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "cenario_json", columnDefinition = "TEXT", nullable = false)
    private String cenarioJson;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now(ZoneOffset.UTC);
        atualizadoEm = criadoEm;
    }

    @PreUpdate
    void preUpdate() {
        atualizadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
