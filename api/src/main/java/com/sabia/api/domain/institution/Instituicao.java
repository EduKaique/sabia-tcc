package com.sabia.api.domain.institution;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "instituicao")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Instituicao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, length = 18)
    private String cnpj;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ModalidadeEnsino modalidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CategoriaAdministrativa categoria;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @PrePersist
    void prePersist() {
        criadaEm = LocalDateTime.now(ZoneOffset.UTC);
    }
}
