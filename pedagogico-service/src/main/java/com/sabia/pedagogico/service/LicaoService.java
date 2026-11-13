package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.LicaoDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoResponse;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LicaoService {

    private final LicaoRepository licaoRepository;
    private final ProgressoLicaoRepository progressoRepository;

    // --------- ALUNO ---------

    public List<LicaoResumoResponse> listarParaAluno(Long alunoId) {
        Map<Long, ProgressoLicao> progressoPorLicao = progressoRepository.findByAlunoId(alunoId).stream()
                .collect(Collectors.toMap(p -> p.getLicao().getId(), p -> p));

        return licaoRepository.findByStatusOrderByOrdemAsc(StatusLicao.ATIVA).stream()
                .map(l -> new LicaoResumoResponse(
                        l.getId(), l.getCodigo(), l.getOrdem(), l.getTitulo(), l.getResumo(),
                        l.getConceito(), l.getHabilidadeBncc(), l.getModo(), l.getVideoId(),
                        toProgressoResponse(l, progressoPorLicao.get(l.getId()))))
                .toList();
    }

    public LicaoDetalheResponse buscarParaAluno(Long alunoId, Long licaoId) {
        var licao = buscarAtiva(licaoId);
        var progresso = progressoRepository.findByAlunoIdAndLicaoId(alunoId, licaoId).orElse(null);
        return new LicaoDetalheResponse(
                licao.getId(), licao.getCodigo(), licao.getOrdem(), licao.getTitulo(), licao.getResumo(),
                licao.getConteudo(), licao.getConceito(), licao.getHabilidadeBncc(),
                licao.getVideoId(), licao.getVideoTitulo(), licao.getVideoCanal(),
                licao.getModo(), licao.getCenarioJson(),
                toProgressoResponse(licao, progresso),
                progresso != null ? progresso.getEstadoJson() : null);
    }

    @Transactional
    public ProgressoLicaoResponse marcarVideoVisto(Long alunoId, Long licaoId) {
        var licao = buscarAtiva(licaoId);
        if (licao.getVideoId() == null) {
            throw new OperacaoInvalidaException("Esta lição não tem vídeo.");
        }
        var progresso = progressoDe(alunoId, licao);
        progresso.setVideoVisto(true);
        atualizarConclusao(progresso);
        return toProgressoResponse(licao, progressoRepository.save(progresso));
    }

    /** Autosave do workspace: só guarda o estado, não mexe na conclusão. */
    @Transactional
    public ProgressoLicaoResponse salvarEstado(Long alunoId, Long licaoId, String estadoJson) {
        var licao = buscarAtiva(licaoId);
        var progresso = progressoDe(alunoId, licao);
        progresso.setEstadoJson(estadoJson);
        return toProgressoResponse(licao, progressoRepository.save(progresso));
    }

    @Transactional
    public ProgressoLicaoResponse concluirAtividade(Long alunoId, Long licaoId, String estadoJson) {
        var licao = buscarAtiva(licaoId);
        var progresso = progressoDe(alunoId, licao);
        progresso.setEstadoJson(estadoJson);
        progresso.setAtividadeConcluida(true);
        atualizarConclusao(progresso);
        return toProgressoResponse(licao, progressoRepository.save(progresso));
    }

    // --------- helpers ---------

    /** Inexistente e INATIVA respondem igual (404), para não expor lições desativadas. */
    private Licao buscarAtiva(Long licaoId) {
        return licaoRepository.findByIdAndStatus(licaoId, StatusLicao.ATIVA)
                .orElseThrow(() -> new ResourceNotFoundException("Lição com id " + licaoId + " não encontrada."));
    }

    /** Upsert: o progresso nasce na primeira interação do aluno com a lição. */
    private ProgressoLicao progressoDe(Long alunoId, Licao licao) {
        return progressoRepository.findByAlunoIdAndLicaoId(alunoId, licao.getId())
                .orElseGet(() -> ProgressoLicao.builder().alunoId(alunoId).licao(licao).build());
    }

    private static boolean concluida(Licao licao, ProgressoLicao p) {
        return p.isAtividadeConcluida() && (licao.getVideoId() == null || p.isVideoVisto());
    }

    /** Grava concluidaEm na primeira vez em que a lição fica concluída; nunca desfaz. */
    private static void atualizarConclusao(ProgressoLicao p) {
        if (p.getConcluidaEm() == null && concluida(p.getLicao(), p)) {
            p.setConcluidaEm(LocalDateTime.now(ZoneOffset.UTC));
        }
    }

    private static ProgressoLicaoResponse toProgressoResponse(Licao licao, ProgressoLicao p) {
        if (p == null) return new ProgressoLicaoResponse(false, false, false, null);
        return new ProgressoLicaoResponse(p.isVideoVisto(), p.isAtividadeConcluida(), concluida(licao, p), p.getConcluidaEm());
    }
}
