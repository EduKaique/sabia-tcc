package com.sabia.pedagogico.config;

import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.service.CenarioRoboValidador;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Cadastra as lições do módulo de aprendizado a partir de classpath:seed/licoes.json, em todos
 * os profiles (dev e prod). O JSON é a fonte da verdade do conteúdo: upsert por `codigo`,
 * sobrescreve os campos de conteúdo, nunca apaga (lição que saiu do JSON vira INATIVA, para
 * preservar o progresso dos alunos). Seed inválido derruba o boot: tudo é validado antes de gravar.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SeedLicoes implements ApplicationRunner {

    static final String ARQUIVO = "seed/licoes.json";
    private static final Pattern VIDEO_ID = Pattern.compile("[A-Za-z0-9_-]{11}");

    private final LicaoRepository licaoRepository;
    private final CenarioRoboValidador cenarioRoboValidador;
    private final ObjectMapper objectMapper;

    /** Item do JSON. `cenario` vem como objeto JSON e é gravado como texto em cenarioJson. */
    record LicaoSeed(String codigo, Integer ordem, String titulo, String resumo, String conteudo,
                     String conceito, String habilidadeBncc, String videoId, String videoTitulo,
                     String videoCanal, ModoAtividade modo, JsonNode cenario) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Licao> lidas = ler().stream().map(this::validar).toList();

        Set<String> codigos = new HashSet<>();
        for (Licao l : lidas) {
            if (!codigos.add(l.getCodigo())) {
                throw invalido(l.getCodigo(), "codigo repetido no arquivo.");
            }
        }

        Map<String, Licao> existentes = licaoRepository.findAll().stream()
                .collect(Collectors.toMap(Licao::getCodigo, Function.identity()));

        int criadas = 0, atualizadas = 0, inativadas = 0;
        for (Licao nova : lidas) {
            Licao atual = existentes.get(nova.getCodigo());
            if (atual == null) {
                licaoRepository.save(nova);
                criadas++;
            } else {
                copiarConteudo(nova, atual);
                atualizadas++;
            }
        }
        for (Licao atual : existentes.values()) {
            if (!codigos.contains(atual.getCodigo()) && atual.getStatus() == StatusLicao.ATIVA) {
                atual.setStatus(StatusLicao.INATIVA);
                inativadas++;
            }
        }
        log.info("Seed de lições: {} criadas, {} atualizadas, {} inativadas.", criadas, atualizadas, inativadas);
    }

    private List<LicaoSeed> ler() {
        var recurso = new ClassPathResource(ARQUIVO);
        if (!recurso.exists()) {
            throw new IllegalStateException("Seed de lições não encontrado: classpath:" + ARQUIVO);
        }
        try (InputStream in = recurso.getInputStream()) {
            LicaoSeed[] itens = objectMapper.readValue(in, LicaoSeed[].class);
            return itens == null ? List.of() : List.of(itens);
        } catch (IOException | JacksonException e) {
            throw new IllegalStateException("Seed de lições inválido: não foi possível ler " + ARQUIVO
                    + " (" + e.getMessage() + ")", e);
        }
    }

    private Licao validar(LicaoSeed s) {
        String codigo = s.codigo();
        if (vazio(codigo)) throw invalido("?", "campo 'codigo' é obrigatório.");
        if (s.ordem() == null) throw invalido(codigo, "campo 'ordem' é obrigatório.");
        if (vazio(s.titulo())) throw invalido(codigo, "campo 'titulo' é obrigatório.");
        if (vazio(s.conceito())) throw invalido(codigo, "campo 'conceito' é obrigatório.");
        if (s.modo() == null) throw invalido(codigo, "campo 'modo' é obrigatório (BLOCOS ou JOGO_ROBO).");
        if (s.videoId() != null && !VIDEO_ID.matcher(s.videoId()).matches()) {
            throw invalido(codigo, "'videoId' deve ser só o id do YouTube (11 caracteres), não a URL.");
        }

        boolean temCenario = s.cenario() != null && !s.cenario().isNull();
        String cenarioJson = null;
        if (s.modo() == ModoAtividade.JOGO_ROBO) {
            if (!temCenario) throw invalido(codigo, "lições JOGO_ROBO precisam de 'cenario'.");
            cenarioJson = objectMapper.writeValueAsString(s.cenario());
            try {
                cenarioRoboValidador.validar(cenarioJson);
            } catch (CenarioInvalidoException e) {
                throw invalido(codigo, e.getMessage());
            }
        } else if (temCenario) {
            throw invalido(codigo, "lições BLOCOS não têm 'cenario'.");
        }

        return Licao.builder()
                .codigo(codigo)
                .ordem(s.ordem())
                .titulo(s.titulo())
                .resumo(s.resumo())
                .conteudo(s.conteudo())
                .conceito(s.conceito())
                .habilidadeBncc(s.habilidadeBncc())
                .videoId(s.videoId())
                .videoTitulo(s.videoTitulo())
                .videoCanal(s.videoCanal())
                .modo(s.modo())
                .cenarioJson(cenarioJson)
                .status(StatusLicao.ATIVA)
                .build();
    }

    private static void copiarConteudo(Licao origem, Licao destino) {
        destino.setOrdem(origem.getOrdem());
        destino.setTitulo(origem.getTitulo());
        destino.setResumo(origem.getResumo());
        destino.setConteudo(origem.getConteudo());
        destino.setConceito(origem.getConceito());
        destino.setHabilidadeBncc(origem.getHabilidadeBncc());
        destino.setVideoId(origem.getVideoId());
        destino.setVideoTitulo(origem.getVideoTitulo());
        destino.setVideoCanal(origem.getVideoCanal());
        destino.setModo(origem.getModo());
        destino.setCenarioJson(origem.getCenarioJson());
        destino.setStatus(StatusLicao.ATIVA);
    }

    private static boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private static IllegalStateException invalido(String codigo, String motivo) {
        return new IllegalStateException("Seed de lições inválido (codigo=" + codigo + "): " + motivo);
    }
}
