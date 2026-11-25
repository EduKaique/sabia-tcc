package com.sabia.pedagogico.model.sandbox;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Projeto livre do aluno no Sandbox: privado (só o próprio aluno lê e altera), sem nota, sem
 * entrega e sem validação no servidor. Não herda de ProjetoScratch para não entrar nas consultas
 * polimórficas dos projetos entregues.
 */
@Entity
@Table(name = "projeto_sandbox", indexes = @Index(name = "idx_projeto_sandbox_aluno", columnList = "aluno_id"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjetoSandbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModoProjetoSandbox modo;

    @Column(name = "estado_json", columnDefinition = "TEXT")
    private String estadoJson;

    /** Snapshot do cenário (só no modo ROBO). */
    @Column(name = "cenario_json", columnDefinition = "TEXT")
    private String cenarioJson;

    /** Atividade de onde o projeto foi copiado ("Continuar no Sandbox"); só informativo. */
    @Column(name = "origem_atividade_id")
    private Long origemAtividadeId;

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
