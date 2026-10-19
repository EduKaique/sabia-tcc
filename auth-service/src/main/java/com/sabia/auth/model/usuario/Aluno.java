package com.sabia.auth.model.usuario;

import jakarta.persistence.*;
import lombok.*;

import java.util.Locale;

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

    /** Matrícula é comparada sem espaços nas pontas e em maiúsculas (cadastro, login e busca). */
    public static String normalizarMatricula(String matricula) {
        return matricula == null ? null : matricula.trim().toUpperCase(Locale.ROOT);
    }
}
