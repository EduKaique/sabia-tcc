package com.sabia.api.model.usuario;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "professor")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Professor {

    @Id
    private Long  id;

    @OneToOne(cascade = CascadeType.ALL)
    @MapsId
    @JoinColumn(name = "id")
    private Usuario usuario;

    private String especialidade;
}
