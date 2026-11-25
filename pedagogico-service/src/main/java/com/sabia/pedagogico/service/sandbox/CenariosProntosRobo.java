package com.sabia.pedagogico.service.sandbox;

import java.util.Map;
import java.util.Optional;

/**
 * Cenários prontos do Jogo do Robô que o aluno pode escolher ao criar um projeto no Sandbox.
 * Espelho de PRESETS_CENARIO em web/src/lib/cenariosRobo.ts: ao mudar um, mude o outro.
 */
public final class CenariosProntosRobo {

    private static final Map<String, String> CENARIOS = Map.of(
            "livre-5x5",
            "{\"versao\":1,\"linhas\":5,\"colunas\":5,\"inicio\":{\"linha\":4,\"coluna\":0},"
                    + "\"destino\":{\"linha\":0,\"coluna\":4},\"obstaculos\":[],"
                    + "\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}",
            "obstaculos-5x5",
            "{\"versao\":1,\"linhas\":5,\"colunas\":5,\"inicio\":{\"linha\":4,\"coluna\":0},"
                    + "\"destino\":{\"linha\":0,\"coluna\":4},"
                    + "\"obstaculos\":[{\"linha\":2,\"coluna\":0},{\"linha\":4,\"coluna\":2}],"
                    + "\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}");

    private CenariosProntosRobo() {
    }

    public static Optional<String> porId(String id) {
        return Optional.ofNullable(id == null ? null : CENARIOS.get(id));
    }
}
