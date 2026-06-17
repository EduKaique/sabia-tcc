package com.sabia.api.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "aluno")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Aluno {

    @Id
    private UUID id;

    @OneToOne(cascade = CascadeType.ALL)
    @MapsId
    @JoinColumn(name = "id")
    private Usuario usuario;

    @Column(nullable = false)
    @Builder.Default
    private int pontuacaoGeral = 0;
}
