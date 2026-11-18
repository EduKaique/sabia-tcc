package com.sabia.pedagogico.model.licao;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Progresso do aluno numa página da lição. Uma linha por (aluno, página), criada na primeira interação.
 * Colunas preenchidas por tipo: vista_em (todas), segundos_video/ultimo_pulso_em/video_conferido_em (vídeo) e
 * tentativas/melhor_percentual/aprovado_em (questionário). Os marcos de conclusão nunca são desfeitos.
 */
@Entity
@Table(
    name = "progresso_pagina",
    uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "pagina_id"})
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProgressoPagina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Sempre o do token. */
    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pagina_id", nullable = false)
    private PaginaLicao pagina;

    @Column(name = "vista_em")
    private LocalDateTime vistaEm;

    @Column(name = "segundos_video")
    private Integer segundosVideo;

    @Column(name = "ultimo_pulso_em")
    private LocalDateTime ultimoPulsoEm;

    @Column(name = "video_conferido_em")
    private LocalDateTime videoConferidoEm;

    private Integer tentativas;

    @Column(name = "melhor_percentual")
    private Integer melhorPercentual;

    @Column(name = "aprovado_em")
    private LocalDateTime aprovadoEm;

    /** Página concluída pela regra do tipo. VIDEO_UPLOAD nunca é concluível. */
    public boolean concluida(TipoPagina tipo) {
        return switch (tipo) {
            case TEXTO, IMAGEM_TEXTO -> vistaEm != null;
            case VIDEO_YOUTUBE -> videoConferidoEm != null;
            case QUESTIONARIO -> aprovadoEm != null;
            case VIDEO_UPLOAD -> false;
        };
    }
}
