package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.RelatorioIaRequest;
import com.sabia.pedagogico.dto.response.RelatorioIaResponse;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.exception.SubmissaoNaoEncontradaException;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

/** CRUD do relatório de IA persistido por submissão (um relatório por submissão). */
@Service
@RequiredArgsConstructor
public class RelatorioIaSubmissaoService {

    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public RelatorioIaResponse buscar(Long professorId, Long submissaoId) {
        var submissao = buscarDoProfessor(professorId, submissaoId);
        if (submissao.getRelatorioIaPreGeradoJson() == null) {
            throw new ResourceNotFoundException("Esta submissão ainda não possui relatório de IA.");
        }
        return objectMapper.readValue(submissao.getRelatorioIaPreGeradoJson(), RelatorioIaResponse.class);
    }

    /** Cria o relatório ou substitui o existente (ex.: nova geração pela IA). */
    @Transactional
    public RelatorioIaResponse salvar(Long professorId, Long submissaoId, RelatorioIaRequest request) {
        var submissao = buscarDoProfessor(professorId, submissaoId);
        submissao.setRelatorioIaPreGeradoJson(objectMapper.writeValueAsString(request));
        submissaoRepository.save(submissao);
        return objectMapper.convertValue(request, RelatorioIaResponse.class);
    }

    @Transactional
    public void remover(Long professorId, Long submissaoId) {
        var submissao = buscarDoProfessor(professorId, submissaoId);
        submissao.setRelatorioIaPreGeradoJson(null);
        submissaoRepository.save(submissao);
    }

    private SubmissaoAvaliativa buscarDoProfessor(Long professorId, Long submissaoId) {
        var submissao = submissaoRepository.findById(submissaoId)
                .orElseThrow(() -> new SubmissaoNaoEncontradaException(submissaoId));
        if (!submissao.getAtividade().getTurma().getProfessorId().equals(professorId)) {
            throw new AcessoNegadoException("Esta submissão não pertence às suas atividades.");
        }
        return submissao;
    }
}
