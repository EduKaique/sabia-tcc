package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
    name = "submissao_avaliativa",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "atividade_id"})
)
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class SubmissaoAvaliativa extends Submissao {

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false, unique = true)
    private ProjetoAvaliativo projeto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atividade_id", nullable = false)
    private AtividadeAvaliativa atividade;

    @OneToOne(mappedBy = "submissao", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Correcao correcao;

}
