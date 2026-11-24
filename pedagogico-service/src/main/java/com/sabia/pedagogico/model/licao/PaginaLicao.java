package com.sabia.pedagogico.model.licao;

import jakarta.persistence.*;
import lombok.*;

/**
 * Página de conteúdo da lição. `conteudoJson` é o JSON normalizado do tipo (ValidadorConteudoPagina);
 * no questionário ele contém o gabarito, que só a API do professor devolve.
 */
@Entity
@Table(
    name = "pagina_licao",
    indexes = @Index(name = "idx_pagina_licao_ordem", columnList = "licao_id, ordem")
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PaginaLicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licao_id", nullable = false)
    private Licao licao;

    /** 0..n-1, regravada a cada salvamento. */
    @Column(nullable = false)
    private int ordem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoPagina tipo;

    @Column(length = 150)
    private String titulo;

    @Column(name = "conteudo_json", columnDefinition = "TEXT", nullable = false)
    private String conteudoJson;
}
