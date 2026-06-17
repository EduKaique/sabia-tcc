package com.sabia.api.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "professor")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Professor {

    @Id
    private UUID id;

    @OneToOne(cascade = CascadeType.ALL)
    @MapsId
    @JoinColumn(name = "id")
    private Usuario usuario;

    private String especialidade;
}
