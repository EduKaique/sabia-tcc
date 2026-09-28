package com.sabia.auth.model.usuario;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aluno")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Aluno {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private Usuario usuario;

    @Column(nullable = false)
    @Builder.Default
    private int pontuacaoGeral = 0;

    @Column(unique = true)
    private String matricula;

    private String avatar;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean perfilCompleto = false;
}
