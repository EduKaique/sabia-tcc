package com.sabia.api.model.instituicao;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "instituicao")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Instituicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @PrePersist
    void prePersist() {
        criadaEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
