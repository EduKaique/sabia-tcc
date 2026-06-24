package com.sabia.api.model.usuario;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aluno")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Aluno {

    @Id
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @MapsId
    @JoinColumn(name = "id")
    private Usuario usuario;

    @Column(nullable = false)
    @Builder.Default
    private int pontuacaoGeral = 0;
}
