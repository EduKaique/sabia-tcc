package com.sabia.pedagogico.service.pratica;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

/** ValidadorPratica.COMANDOS deve ser igual à chave "comandos" de fixtures/blocos-livres/classificacao.json. */
class ClassificacaoBlocosLivresTest {

    static Path classificacao() {
        for (Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath(); dir != null; dir = dir.getParent()) {
            Path arquivo = dir.resolve("fixtures").resolve("blocos-livres").resolve("classificacao.json");
            if (Files.isRegularFile(arquivo)) {
                return arquivo;
            }
        }
        return fail("fixtures/blocos-livres/classificacao.json não encontrado a partir de "
                + System.getProperty("user.dir") + ". No Docker, monte a raiz do repositório.");
    }

    @Test
    void comandosDoJavaIguaisAosDoFixture() throws IOException {
        JsonNode raiz = JsonMapper.builder().build().readTree(Files.readString(classificacao()));
        Set<String> comandos = new HashSet<>();
        raiz.get("comandos").forEach(t -> comandos.add(t.stringValue()));

        assertThat(ValidadorPratica.COMANDOS).containsExactlyInAnyOrderElementsOf(comandos);
    }
}
