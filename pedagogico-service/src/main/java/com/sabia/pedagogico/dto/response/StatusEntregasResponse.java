package com.sabia.pedagogico.dto.response;

public record StatusEntregasResponse(
        long totalEsperado,
        long naoEntregues,
        long pendentes,
        long emCorrecao,
        long corrigidas,
        long entreguesNoPrazo,
        long entreguesComAtraso
) {}
