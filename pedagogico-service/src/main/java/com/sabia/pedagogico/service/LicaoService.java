package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.ConclusaoAtividadeResponse;
import com.sabia.pedagogico.dto.response.LicaoDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.PaginaAlunoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoResponse;
import com.sabia.pedagogico.dto.response.ProgressoPaginaResponse;
import com.sabia.pedagogico.dto.response.TurmaVinculadaResponse;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.service.licao.ConteudoPaginaLeitor;
import com.sabia.pedagogico.service.licao.ProgressoLicaoRegras;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lições do ponto de vista do aluno. Visível = ATIVA, publicada e vinculada a uma turma em que o aluno do token
 * está matriculado; fora disso, 404 igual ao inexistente. As respostas são montadas campo a campo, sem gabarito.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LicaoService {

    static final String CONTEUDO_PENDENTE = "Conclua o conteúdo da lição antes da prática.";

    private final LicaoRepository licaoRepository;
    private final LicaoTurmaRepository licaoTurmaRepository;
    private final PaginaLicaoRepository paginaRepository;
    private final ProgressoLicaoRepository progressoRepository;
    private final ProgressoPaginaRepository progressoPaginaRepository;
    private final ConteudoPaginaLeitor leitor;
    private final ValidadorPratica validadorPratica;
    private final Clock relogio;

    // --------- ALUNO ---------

    /** Número fixo de consultas, independente da quantidade de lições: vínculos, páginas e os dois progressos. */
    public List<LicaoResumoResponse> listarParaAluno(Long alunoId) {
        List<LicaoTurma> vinculos = licaoTurmaRepository.findVisiveisParaAluno(alunoId);
        if (vinculos.isEmpty()) return List.of();

        Map<Long, Licao> licoes = new LinkedHashMap<>();
        Map<Long, List<TurmaVinculadaResponse>> turmas = new LinkedHashMap<>();
        for (LicaoTurma lt : vinculos) {
            licoes.putIfAbsent(lt.getLicao().getId(), lt.getLicao());
            turmas.computeIfAbsent(lt.getLicao().getId(), k -> new ArrayList<>())
                    .add(new TurmaVinculadaResponse(lt.getTurma().getId(), lt.getTurma().getNome()));
        }
        List<PaginaLicao> paginas = paginaRepository.findByLicaoIdIn(licoes.keySet());
        Map<Long, List<PaginaLicao>> paginasPorLicao = paginas.stream()
                .collect(Collectors.groupingBy(p -> p.getLicao().getId()));
        Map<Long, ProgressoPagina> progressoPorPagina = progressoDasPaginas(alunoId, paginas);
        Map<Long, ProgressoLicao> progressoPorLicao = progressoRepository
                .findByAlunoIdAndLicaoIdIn(alunoId, licoes.keySet()).stream()
                .collect(Collectors.toMap(p -> p.getLicao().getId(), Function.identity()));

        return licoes.values().stream()
                .sorted(Comparator.comparing(Licao::getPublicadaEm, Comparator.reverseOrder())
                        .thenComparing(Licao::getId, Comparator.reverseOrder()))
                .map(l -> {
                    List<PaginaLicao> ps = paginasPorLicao.getOrDefault(l.getId(), List.of());
                    ProgressoLicao pl = progressoPorLicao.get(l.getId());
                    return new LicaoResumoResponse(l.getId(), l.getTitulo(), l.getConceito(), l.getResumo(),
                            l.getModo(), ProgressoLicaoRegras.estado(ps, progressoPorPagina, pl), ps.size(),
                            ProgressoLicaoRegras.paginasConcluidas(ps, progressoPorPagina),
                            pl != null && pl.isAtividadeConcluida(), pl != null ? pl.getConcluidaEm() : null,
                            turmas.get(l.getId()));
                })
                .toList();
    }

    public LicaoDetalheResponse buscarParaAluno(Long alunoId, Long licaoId) {
        Licao licao = buscarVisivel(alunoId, licaoId);
        List<PaginaLicao> paginas = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId);
        Map<Long, ProgressoPagina> porPagina = progressoDasPaginas(alunoId, paginas);
        ProgressoLicao pl = progressoRepository.findByAlunoIdAndLicaoId(alunoId, licaoId).orElse(null);
        List<PaginaAlunoResponse> respostas = paginas.stream()
                .map(p -> new PaginaAlunoResponse(p.getId(), p.getOrdem(), p.getTipo(), p.getTitulo(),
                        leitor.paraAluno(p), progressoDaPagina(p, porPagina.get(p.getId()))))
                .toList();
        return new LicaoDetalheResponse(licao.getId(), licao.getTitulo(), licao.getConceito(), licao.getResumo(),
                licao.getModo(), licao.getCenarioJson(), pl != null ? pl.getEstadoJson() : null,
                pl != null && pl.isAtividadeConcluida(), pl != null ? pl.getConcluidaEm() : null,
                ProgressoLicaoRegras.estado(paginas, porPagina, pl),
                ProgressoLicaoRegras.praticaLiberada(paginas, porPagina, pl), respostas);
    }

    /** Autosave do workspace: só guarda o estado, não exige o conteúdo concluído nem mexe na conclusão. */
    @Transactional
    public ProgressoLicaoResponse salvarEstado(Long alunoId, Long licaoId, String estadoJson) {
        var licao = buscarVisivel(alunoId, licaoId);
        var progresso = progressoDe(alunoId, licao);
        progresso.setEstadoJson(estadoJson);
        return toProgressoResponse(progressoRepository.save(progresso));
    }

    /**
     * O servidor decide a conclusão da prática (ValidadorPratica). Enquanto a lição não foi concluída, a prática
     * exige todas as páginas concluídas (422). Depois de concluída, pode ser refeita livremente. Não concluir não
     * é erro: devolve o resultado com atividadeConcluida=false. Uma prática concluída nunca volta a false, e
     * concluidaEm é gravado uma vez, na primeira em que atividadeConcluida passa a true.
     */
    @Transactional
    public ConclusaoAtividadeResponse concluirAtividade(Long alunoId, Long licaoId, String estadoJson) {
        var licao = buscarVisivel(alunoId, licaoId);
        var progresso = progressoDe(alunoId, licao);
        if (progresso.getConcluidaEm() == null) {
            List<PaginaLicao> paginas = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId);
            if (ProgressoLicaoRegras.paginasConcluidas(paginas, progressoDasPaginas(alunoId, paginas))
                    < paginas.size()) {
                throw new OperacaoInvalidaException(CONTEUDO_PENDENTE);
            }
        }
        // Valida antes de gravar: entrada ilegível vira 400 e lição do robô sem cenário vira 422.
        ResultadoValidacao validacao = validadorPratica.validar(licao.getModo(), licao.getCenarioJson(), estadoJson);
        progresso.setEstadoJson(estadoJson);
        if (validacao.concluida()) {
            progresso.setAtividadeConcluida(true);
        }
        if (progresso.getConcluidaEm() == null && progresso.isAtividadeConcluida()) {
            progresso.setConcluidaEm(LocalDateTime.now(relogio));
        }
        var p = toProgressoResponse(progressoRepository.save(progresso));
        return new ConclusaoAtividadeResponse(p.atividadeConcluida(), p.concluida(), p.concluidaEm(), validacao);
    }

    // --------- usados pelo ProgressoPaginaService (públicos: chamados através do proxy) ---------

    /** Inexistente, rascunho, arquivada, legada ou de turma alheia respondem igual (404). */
    public Licao buscarVisivel(Long alunoId, Long licaoId) {
        return licaoRepository.findVisivelParaAluno(licaoId, alunoId)
                .orElseThrow(() -> new ResourceNotFoundException("Lição com id " + licaoId + " não encontrada."));
    }

    public boolean praticaLiberada(Long alunoId, Long licaoId) {
        List<PaginaLicao> paginas = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId);
        ProgressoLicao pl = progressoRepository.findByAlunoIdAndLicaoId(alunoId, licaoId).orElse(null);
        return ProgressoLicaoRegras.praticaLiberada(paginas, progressoDasPaginas(alunoId, paginas), pl);
    }

    // --------- helpers ---------

    private Map<Long, ProgressoPagina> progressoDasPaginas(Long alunoId, List<PaginaLicao> paginas) {
        if (paginas.isEmpty()) return Map.of();
        return progressoPaginaRepository
                .findByAlunoIdAndPaginaIdIn(alunoId, paginas.stream().map(PaginaLicao::getId).toList()).stream()
                .collect(Collectors.toMap(pp -> pp.getPagina().getId(), Function.identity()));
    }

    private ProgressoPaginaResponse progressoDaPagina(PaginaLicao pagina, ProgressoPagina pp) {
        boolean concluida = ProgressoLicaoRegras.paginaConcluida(pagina, pp);
        LocalDateTime vistaEm = pp != null ? pp.getVistaEm() : null;
        if (pagina.getTipo() == TipoPagina.VIDEO_YOUTUBE) {
            Integer duracao = leitor.video(pagina).duracaoSegundos();
            return new ProgressoPaginaResponse(concluida, vistaEm, new ProgressoPaginaResponse.Video(
                    pp != null && pp.getSegundosVideo() != null ? pp.getSegundosVideo() : 0,
                    duracao != null ? ProgressoLicaoRegras.segundosNecessarios(duracao) : 0, concluida), null);
        }
        if (pagina.getTipo() == TipoPagina.QUESTIONARIO) {
            return new ProgressoPaginaResponse(concluida, vistaEm, null, new ProgressoPaginaResponse.Questionario(
                    pp != null && pp.getTentativas() != null ? pp.getTentativas() : 0,
                    pp != null ? pp.getMelhorPercentual() : null, concluida));
        }
        return new ProgressoPaginaResponse(concluida, vistaEm, null, null);
    }

    /** Upsert: o progresso nasce na primeira interação do aluno com a lição. */
    private ProgressoLicao progressoDe(Long alunoId, Licao licao) {
        return progressoRepository.findByAlunoIdAndLicaoId(alunoId, licao.getId())
                .orElseGet(() -> ProgressoLicao.builder().alunoId(alunoId).licao(licao).build());
    }

    private static ProgressoLicaoResponse toProgressoResponse(ProgressoLicao p) {
        return new ProgressoLicaoResponse(p.isAtividadeConcluida(), p.getConcluidaEm() != null, p.getConcluidaEm());
    }
}
