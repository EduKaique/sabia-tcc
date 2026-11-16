package com.sabia.pedagogico.dto.response;

import java.time.LocalDateTime;

/** Projeto entregue pelo próprio aluno, para visualização somente leitura. */
public record ProjetoEntregueResponse(
        String estadoJson,
        LocalDateTime dataEnvio
) {}
