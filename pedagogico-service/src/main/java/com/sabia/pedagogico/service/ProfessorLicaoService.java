package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CriarLicaoRequest;
import com.sabia.pedagogico.dto.request.PaginaLicaoRequest;
import com.sabia.pedagogico.dto.request.SalvarLicaoRequest;
import com.sabia.pedagogico.dto.request.VincularTurmasRequest;
import com.sabia.pedagogico.dto.response.LicaoProfessorDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoProfessorResumoResponse;
import com.sabia.pedagogico.dto.response.PaginaLicaoResponse;
import com.sabia.pedagogico.dto.response.TurmaVinculadaResponse;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ConteudoInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.EstadoLicao;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Autoria de lições pelo professor: o dono vem sempre do token. Lição de outro professor (ou legada, sem
 * dono) responde 403; inexistente, 404. Arquivada (status INATIVA) sai da lista e não aceita escrita.
 * Logs só com ids: nunca conteúdo de páginas, URLs ou textos de questionário.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProfessorLicaoService {

    static final int LIMITE_POR_PROFESSOR = 200;
    static final int MAX_BYTES_CONTEUDO = 256 * 1024;

    private final LicaoRepository licaoRepository;
    private final PaginaLicaoRepository paginaRepository;
    private final LicaoTurmaRepository licaoTurmaRepository;
    private final ProgressoPaginaRepository progressoPaginaRepository;
    private final TurmaRepository turmaRepository;
    private final CenarioRoboValidador cenarioRoboValidador;
    private final ValidadorConteudoPagina validadorConteudo;
    private final ObjectMapper objectMapper;

    public List<LicaoProfessorResumoResponse> listar(Long professorId, Long turmaId) {
        List<Licao> licoes;
        if (turmaId != null) {
            turmaDoProfessor(professorId, turmaId);
            licoes = licaoRepository.findDoProfessorPorTurma(professorId, StatusLicao.ATIVA, turmaId);
        } else {
            licoes = licaoRepository.findByProfessorIdAndStatusOrderByAtualizadaEmDesc(professorId, StatusLicao.ATIVA);
        }
        if (licoes.isEmpty()) return List.of();

        List<Long> ids = licoes.stream().map(Licao::getId).toList();
        Map<Long, List<TurmaVinculadaResponse>> turmas = licaoTurmaRepository.findComTurmaByLicaoIdIn(ids).stream()
                .collect(Collectors.groupingBy(lt -> lt.getLicao().getId(),
                        Collectors.mapping(lt -> new TurmaVinculadaResponse(lt.getTurma().getId(), lt.getTurma().getNome()),
                                Collectors.toList())));
        Map<Long, Long> paginas = new HashMap<>();
        for (Object[] linha : paginaRepository.contarPorLicao(ids)) {
            paginas.put((Long) linha[0], ((Number) linha[1]).longValue());
        }

        return licoes.stream()
                .map(l -> new LicaoProfessorResumoResponse(l.getId(), EstadoLicao.de(l), l.getTitulo(), l.getConceito(),
                        l.getResumo(), l.getModo(), turmas.getOrDefault(l.getId(), List.of()),
                        paginas.getOrDefault(l.getId(), 0L), l.getAtualizadaEm()))
                .toList();
    }

    @Transactional
    public LicaoProfessorDetalheResponse criar(Long professorId, CriarLicaoRequest request) {
        if (licaoRepository.countByProfessorIdAndStatus(professorId, StatusLicao.ATIVA) >= LIMITE_POR_PROFESSOR) {
            throw new ConflitoException("Você atingiu o limite de " + LIMITE_POR_PROFESSOR
                    + " lições. Arquive alguma para criar outra.");
        }
        LocalDateTime agora = agora();
        Licao licao = licaoRepository.save(Licao.builder()
                .codigo("p-" + UUID.randomUUID())
                .ordem(0)
                .titulo(request.titulo())
                .conceito(request.conceito())
                .resumo(vazioComoNulo(request.resumo()))
                .modo(ModoAtividade.BLOCOS)
                .status(StatusLicao.ATIVA)
                .professorId(professorId)
                .criadaEm(agora)
                .atualizadaEm(agora)
                .build());
        log.info("Lição criada id={} por professor id={}", licao.getId(), professorId);
        return detalhe(licao, List.of(), List.of());
    }

    public LicaoProfessorDetalheResponse buscar(Long professorId, Long licaoId) {
        return detalhe(doProfessor(professorId, licaoId));
    }

    /** Metadados, prática e páginas numa transação. Tudo é validado antes de qualquer gravação. */
    @Transactional
    public LicaoProfessorDetalheResponse salvar(Long professorId, Long licaoId, SalvarLicaoRequest request) {
        Licao licao = editavel(professorId, licaoId);
        String cenarioJson = cenarioDoModo(request.modo(), request.cenarioJson());

        Map<Long, PaginaLicao> existentes = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId).stream()
                .collect(Collectors.toMap(PaginaLicao::getId, Function.identity()));
        Map<String, String> erros = new LinkedHashMap<>();
        List<String> conteudos = new ArrayList<>();
        Set<Long> idsUsados = new LinkedHashSet<>();
        long bytes = 0;
        for (int i = 0; i < request.paginas().size(); i++) {
            PaginaLicaoRequest p = request.paginas().get(i);
            if (p.id() != null && !existentes.containsKey(p.id())) {
                erros.putIfAbsent("paginas[" + i + "].id", "A página não pertence a esta lição.");
            } else if (p.id() != null && !idsUsados.add(p.id())) {
                erros.putIfAbsent("paginas[" + i + "].id", "A página aparece mais de uma vez na lista.");
            }
            String json = validadorConteudo.validar(i, p.tipo(), p.conteudo(), erros);
            conteudos.add(json);
            if (json != null) bytes += json.getBytes(StandardCharsets.UTF_8).length;
        }
        if (bytes > MAX_BYTES_CONTEUDO) {
            erros.putIfAbsent("paginas", "O conteúdo das páginas passa do limite de 256 KB.");
        }
        if (!erros.isEmpty()) {
            throw new ConteudoInvalidoException(erros);
        }

        licao.setTitulo(request.titulo());
        licao.setConceito(request.conceito());
        licao.setResumo(vazioComoNulo(request.resumo()));
        licao.setModo(request.modo());
        licao.setCenarioJson(cenarioJson);
        licao.setAtualizadaEm(agora());

        List<PaginaLicao> paginas = new ArrayList<>();
        for (int i = 0; i < request.paginas().size(); i++) {
            PaginaLicaoRequest p = request.paginas().get(i);
            PaginaLicao pagina = p.id() != null ? existentes.get(p.id()) : PaginaLicao.builder().licao(licao).build();
            pagina.setOrdem(i);
            pagina.setTipo(p.tipo());
            pagina.setTitulo(p.titulo());
            pagina.setConteudoJson(conteudos.get(i));
            paginas.add(pagina);
        }
        List<PaginaLicao> removidas = existentes.values().stream().filter(p -> !idsUsados.contains(p.getId())).toList();
        if (!removidas.isEmpty()) {
            // O progresso dos alunos nas páginas removidas sai antes (FK de progresso_pagina).
            progressoPaginaRepository.deleteByPaginaIdIn(removidas.stream().map(PaginaLicao::getId).toList());
            paginaRepository.deleteAll(removidas);
        }
        List<PaginaLicao> salvas = paginaRepository.saveAll(paginas);
        licaoRepository.save(licao);
        log.info("Lição id={} salva por professor id={} ({} páginas, {} removidas)",
                licaoId, professorId, salvas.size(), removidas.size());
        return detalhe(licao, salvas, turmaIds(licaoId));
    }

    /** Substitui os vínculos. Toda turma é conferida antes de gravar: uma alheia recusa o pedido inteiro. */
    @Transactional
    public LicaoProfessorDetalheResponse vincularTurmas(Long professorId, Long licaoId, VincularTurmasRequest request) {
        Licao licao = editavel(professorId, licaoId);
        Map<Long, Turma> turmas = new LinkedHashMap<>();
        for (Long turmaId : new LinkedHashSet<>(request.turmaIds())) {
            turmas.put(turmaId, turmaDoProfessor(professorId, turmaId));
        }

        List<LicaoTurma> atuais = licaoTurmaRepository.findByLicaoId(licaoId);
        List<LicaoTurma> removidos = atuais.stream().filter(lt -> !turmas.containsKey(lt.getTurma().getId())).toList();
        Set<Long> mantidas = atuais.stream().map(lt -> lt.getTurma().getId()).collect(Collectors.toSet());
        LocalDateTime agora = agora();
        List<LicaoTurma> novos = turmas.values().stream()
                .filter(t -> !mantidas.contains(t.getId()))
                .map(t -> LicaoTurma.builder().licao(licao).turma(t).vinculadaEm(agora).build())
                .toList();
        if (!removidos.isEmpty()) licaoTurmaRepository.deleteAll(removidos);
        if (!novos.isEmpty()) licaoTurmaRepository.saveAll(novos);
        licao.setAtualizadaEm(agora);
        licaoRepository.save(licao);
        log.info("Lição id={} vinculada a {} turmas por professor id={}", licaoId, turmas.size(), professorId);
        return detalhe(licao, paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId), List.copyOf(turmas.keySet()));
    }

    /** Idempotente. Exige ao menos uma página, duração em todo vídeo e cenário válido no Jogo do Robô. */
    @Transactional
    public LicaoProfessorDetalheResponse publicar(Long professorId, Long licaoId) {
        Licao licao = editavel(professorId, licaoId);
        if (licao.getPublicadaEm() != null) return detalhe(licao);

        List<PaginaLicao> paginas = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId);
        if (paginas.isEmpty()) {
            throw new OperacaoInvalidaException("Adicione ao menos uma página antes de publicar.");
        }
        for (PaginaLicao p : paginas) {
            if (p.getTipo() == TipoPagina.VIDEO_YOUTUBE) {
                var duracao = objectMapper.readTree(p.getConteudoJson()).get("duracaoSegundos");
                if (duracao == null || duracao.isNull()) {
                    throw new OperacaoInvalidaException("Informe a duração de todos os vídeos antes de publicar.");
                }
            }
        }
        if (licao.getModo() == ModoAtividade.JOGO_ROBO) {
            if (licao.getCenarioJson() == null || licao.getCenarioJson().isBlank()) {
                throw new OperacaoInvalidaException("Escolha o cenário do Jogo do Robô antes de publicar.");
            }
            try {
                cenarioRoboValidador.validar(licao.getCenarioJson());
            } catch (CenarioInvalidoException e) {
                throw new OperacaoInvalidaException("O cenário do Jogo do Robô é inválido: " + e.getMessage());
            }
        }
        LocalDateTime agora = agora();
        licao.setPublicadaEm(agora);
        licao.setAtualizadaEm(agora);
        licaoRepository.save(licao);
        log.info("Lição id={} publicada por professor id={}", licaoId, professorId);
        return detalhe(licao, paginas, turmaIds(licaoId));
    }

    /** Volta a rascunho sem apagar nada. Idempotente. */
    @Transactional
    public LicaoProfessorDetalheResponse despublicar(Long professorId, Long licaoId) {
        Licao licao = editavel(professorId, licaoId);
        if (licao.getPublicadaEm() != null) {
            licao.setPublicadaEm(null);
            licao.setAtualizadaEm(agora());
            licaoRepository.save(licao);
            log.info("Lição id={} despublicada por professor id={}", licaoId, professorId);
        }
        return detalhe(licao);
    }

    /** DELETE = arquivar (status INATIVA), sem exclusão física. Idempotente. */
    @Transactional
    public void arquivar(Long professorId, Long licaoId) {
        Licao licao = doProfessor(professorId, licaoId);
        if (licao.getStatus() != StatusLicao.INATIVA) {
            licao.setStatus(StatusLicao.INATIVA);
            licao.setAtualizadaEm(agora());
            licaoRepository.save(licao);
            log.info("Lição id={} arquivada por professor id={}", licaoId, professorId);
        }
    }

    // --------- helpers ---------

    private Licao doProfessor(Long professorId, Long licaoId) {
        Licao licao = licaoRepository.findById(licaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Lição com id " + licaoId + " não encontrada."));
        if (!professorId.equals(licao.getProfessorId())) {
            throw new AcessoNegadoException("Esta lição não pertence ao seu perfil.");
        }
        return licao;
    }

    private Licao editavel(Long professorId, Long licaoId) {
        Licao licao = doProfessor(professorId, licaoId);
        if (licao.getStatus() == StatusLicao.INATIVA) {
            throw new OperacaoInvalidaException("Lição arquivada.");
        }
        return licao;
    }

    private Turma turmaDoProfessor(Long professorId, Long turmaId) {
        return turmaRepository.findByIdAndProfessorId(turmaId, professorId)
                .orElseThrow(() -> new AcessoNegadoException("Esta turma não pertence ao seu perfil."));
    }

    /** Como AtividadeAvaliativaService.cenarioDoModo, mas o rascunho do robô pode ficar sem cenário. */
    private String cenarioDoModo(ModoAtividade modo, String cenarioJson) {
        if (modo != ModoAtividade.JOGO_ROBO || cenarioJson == null || cenarioJson.isBlank()) return null;
        cenarioRoboValidador.validar(cenarioJson);
        return cenarioJson;
    }

    private List<Long> turmaIds(Long licaoId) {
        return licaoTurmaRepository.findByLicaoId(licaoId).stream().map(lt -> lt.getTurma().getId()).sorted().toList();
    }

    private LicaoProfessorDetalheResponse detalhe(Licao licao) {
        return detalhe(licao, paginaRepository.findByLicaoIdOrderByOrdemAsc(licao.getId()), turmaIds(licao.getId()));
    }

    private LicaoProfessorDetalheResponse detalhe(Licao licao, List<PaginaLicao> paginas, List<Long> turmaIds) {
        List<PaginaLicaoResponse> respostas = paginas.stream()
                .map(p -> new PaginaLicaoResponse(p.getId(), p.getOrdem(), p.getTipo(), p.getTitulo(),
                        objectMapper.readTree(p.getConteudoJson())))
                .toList();
        return new LicaoProfessorDetalheResponse(licao.getId(), EstadoLicao.de(licao), licao.getTitulo(),
                licao.getConceito(), licao.getResumo(), licao.getModo(), licao.getCenarioJson(),
                turmaIds.stream().sorted().toList(), respostas, licao.getPublicadaEm(), licao.getCriadaEm(),
                licao.getAtualizadaEm());
    }

    private static String vazioComoNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor;
    }

    private static LocalDateTime agora() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
