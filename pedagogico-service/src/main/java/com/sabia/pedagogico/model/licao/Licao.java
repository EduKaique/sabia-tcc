package com.sabia.pedagogico.model.licao;

import jakarta.persistence.*;
import lombok.*;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

/**
 * Lição do módulo de aprendizado: conteúdo global (sem turma), com vídeo opcional e uma
 * prática própria (modo + cenário). Cadastrada pelo seed (config/SeedLicoes), chave natural `codigo`.
 */
@Entity
@Table(name = "licao")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Licao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(nullable = false)
    private int ordem;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumo;

    /** HTML; o front sanitiza antes de exibir. */
    @Column(columnDefinition = "TEXT")
    private String conteudo;

    @Column(nullable = false)
    private String conceito;

    private String habilidadeBncc;

    @Column(length = 20)
    private String videoId;

    private String videoTitulo;

    private String videoCanal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModoAtividade modo;

    /** Obrigatório quando modo = JOGO_ROBO (validado no seed pelo CenarioRoboValidador). */
    @Column(columnDefinition = "TEXT")
    private String cenarioJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusLicao status = StatusLicao.ATIVA;
}
