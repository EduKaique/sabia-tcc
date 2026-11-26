package com.sabia.pedagogico.model.licao;

import jakarta.persistence.*;
import lombok.*;

import com.sabia.pedagogico.model.atividade.ModoAtividade;

import java.time.LocalDateTime;

/**
 * Lição do módulo de aprendizado, criada por um professor: páginas de conteúdo (PaginaLicao), vínculo com
 * turmas (LicaoTurma) e uma prática própria (modo + cenário). Colunas novas são anuláveis (ddl-auto update):
 * as lições legadas do antigo seed ficam com professorId nulo. `conceito` e `modo`
 * continuam NOT NULL no banco e são sempre preenchidos pelo serviço.
 */
@Entity
@Table(name = "licao")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Licao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumo;

    @Column(nullable = false)
    private String conceito;

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

    /** Dono. Nulo nas lições legadas, que nenhum professor acessa. */
    @Column(name = "professor_id")
    private Long professorId;

    /** Nulo = rascunho. Não usar novos valores de StatusLicao: a coluna tem CHECK com ATIVA/INATIVA. */
    @Column(name = "publicada_em")
    private LocalDateTime publicadaEm;

    @Column(name = "criada_em")
    private LocalDateTime criadaEm;

    @Column(name = "atualizada_em")
    private LocalDateTime atualizadaEm;
}
