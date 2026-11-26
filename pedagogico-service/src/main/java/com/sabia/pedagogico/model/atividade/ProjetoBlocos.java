package com.sabia.pedagogico.model.atividade;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public abstract class ProjetoBlocos {

    /**
     * A raiz já se chamou ProjetoScratch e o Hibernate derivava a sequence do nome da entidade
     * (projeto_scratch_seq, incremento 50). O nome e o incremento ficam fixos aqui para que o rename da
     * classe não crie uma sequence nova começando em 1 e colida com ids já gravados em projeto_avaliativo.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "projeto_blocos_id_gen")
    @SequenceGenerator(name = "projeto_blocos_id_gen", sequenceName = "projeto_scratch_seq", allocationSize = 50)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(columnDefinition = "TEXT")
    private String estadoJson;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
