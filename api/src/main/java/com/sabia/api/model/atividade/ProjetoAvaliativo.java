package com.sabia.api.model.atividade;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "projeto_avaliativo")
@Getter @Setter @SuperBuilder @NoArgsConstructor
public class ProjetoAvaliativo extends ProjetoScratch{

}
