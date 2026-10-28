package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.RelatorioRequest;
import com.sabia.pedagogico.dto.response.RelatorioAtividadeResponse;
import com.sabia.pedagogico.dto.response.RelatorioProfessorResponse;
import com.sabia.pedagogico.dto.response.RelatorioTurmaResponse;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.service.regras.RelatorioRules;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RelatorioProfessorService {

    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AtividadeAvaliativaRepository atividadeRepository;
    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final RelatorioRules rules;

    public RelatorioProfessorResponse gerar(Long professorId, RelatorioRequest request) {
        rules.validarPeriodo(request.dataInicio(), request.dataFim());

        var turmas = selecionarTurmas(professorId, request.turmaId());
        var atividades = selecionarAtividades(professorId, request, turmas);
        var submissoes = submissaoRepository.findByAtividade_Turma_ProfessorId(professorId).stream()
                .filter(submissao -> atividades.stream()
                        .anyMatch(atividade -> atividade.getId().equals(submissao.getAtividade().getId())))
                .filter(submissao -> dentroDoPeriodo(
                        submissao.getDataEnvio(), request.dataInicio(), request.dataFim()))
                .toList();

        if (!request.incluirDetalhesOrDefault()) {
            return resumo(professorId, turmas, atividades, submissoes);
        }

        var submissoesPorAtividade = submissoes.stream()
                .collect(Collectors.groupingBy(submissao -> submissao.getAtividade().getId()));
        var matriculasPorTurma = turmas.stream()
                .collect(Collectors.toMap(Turma::getId, turma -> turmaAlunoRepository.findByTurmaId(turma.getId())));

        var turmasResponse = turmas.stream()
                .map(turma -> turmaResponse(turma, atividades, matriculasPorTurma.get(turma.getId()), submissoesPorAtividade))
                .toList();
        var atividadesResponse = atividades.stream()
                .map(atividade -> atividadeResponse(
                        atividade,
                        matriculasPorTurma.get(atividade.getTurma().getId()),
                        submissoesPorAtividade.getOrDefault(atividade.getId(), List.of())))
                .toList();

        return new RelatorioProfessorResponse(
                turmas.size(),
                totalAlunos(matriculasPorTurma.values().stream().flatMap(List::stream).toList()),
                atividades.size(),
                submissoes.size(),
                rules.taxa(submissoes.size(), denominador(turmas, atividades, matriculasPorTurma)),
                rules.taxa(corrigidas(submissoes), submissoes.size()),
                rules.mediaNotas(submissoes),
                turmasResponse,
                atividadesResponse
        );
    }

    private RelatorioProfessorResponse resumo(
            Long professorId,
            List<Turma> turmas,
            List<AtividadeAvaliativa> atividades,
            List<SubmissaoAvaliativa> submissoes) {
        var matriculas = turmas.stream()
                .flatMap(turma -> turmaAlunoRepository.findByTurmaId(turma.getId()).stream())
                .toList();
        return new RelatorioProfessorResponse(
                turmas.size(),
                totalAlunos(matriculas),
                atividades.size(),
                submissoes.size(),
                rules.taxa(submissoes.size(), (long) totalAlunos(matriculas) * atividades.size()),
                rules.taxa(corrigidas(submissoes), submissoes.size()),
                rules.mediaNotas(submissoes),
                List.of(),
                List.of()
        );
    }

    private List<Turma> selecionarTurmas(Long professorId, Long turmaId) {
        if (turmaId == null) {
            return turmaRepository.findByProfessorId(professorId);
        }
        return List.of(turmaRepository.findByIdAndProfessorId(turmaId, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada.")));
    }

    private List<AtividadeAvaliativa> selecionarAtividades(
            Long professorId,
            RelatorioRequest request,
            List<Turma> turmas) {
        var atividades = request.turmaId() == null
                ? atividadeRepository.findByTurma_ProfessorId(professorId)
                : atividadeRepository.findByTurmaIdIn(turmas.stream().map(Turma::getId).toList());

        if (request.atividadeId() != null) {
            atividades = atividades.stream()
                    .filter(atividade -> atividade.getId().equals(request.atividadeId()))
                    .toList();
            if (atividades.isEmpty()) {
                throw new ResourceNotFoundException("Atividade não encontrada.");
            }
        }

        return atividades.stream()
                .filter(atividade -> dentroDoPeriodo(
                        atividade.getCriadaEm(), request.dataInicio(), request.dataFim()))
                .toList();
    }

    private RelatorioTurmaResponse turmaResponse(
            Turma turma,
            List<AtividadeAvaliativa> atividades,
            List<TurmaAluno> matriculas,
            Map<Long, List<SubmissaoAvaliativa>> submissoesPorAtividade) {
        var atividadesDaTurma = atividades.stream()
                .filter(atividade -> atividade.getTurma().getId().equals(turma.getId()))
                .toList();
        var submissoes = atividadesDaTurma.stream()
                .flatMap(atividade -> submissoesPorAtividade
                        .getOrDefault(atividade.getId(), List.of()).stream())
                .toList();
        return new RelatorioTurmaResponse(
                turma.getId(),
                turma.getNome(),
                matriculas == null ? 0 : rules.totalAlunos(matriculas),
                atividadesDaTurma.size(),
                submissoes.size(),
                rules.taxa(submissoes.size(), denominador(matriculas, atividadesDaTurma.size())),
                rules.mediaNotas(submissoes)
        );
    }

    private RelatorioAtividadeResponse atividadeResponse(
            AtividadeAvaliativa atividade,
            List<TurmaAluno> matriculas,
            List<SubmissaoAvaliativa> submissoes) {
        long totalAlunos = matriculas == null ? 0 : rules.totalAlunos(matriculas);
        return new RelatorioAtividadeResponse(
                atividade.getId(),
                atividade.getTitulo(),
                atividade.getTurma().getNome(),
                totalAlunos,
                submissoes.size(),
                rules.taxa(submissoes.size(), totalAlunos),
                rules.mediaNotas(submissoes)
        );
    }

    private long totalAlunos(List<TurmaAluno> matriculas) {
        return rules.totalAlunos(matriculas);
    }

    private long denominador(
            List<Turma> turmas,
            List<AtividadeAvaliativa> atividades,
            Map<Long, List<TurmaAluno>> matriculasPorTurma) {
        return atividades.stream()
                .mapToLong(atividade -> matriculasPorTurma.getOrDefault(
                        atividade.getTurma().getId(), List.of()).stream()
                        .map(TurmaAluno::getAlunoId)
                        .distinct()
                        .count())
                .sum();
    }

    private long denominador(List<TurmaAluno> matriculas, long totalAtividades) {
        return (matriculas == null ? 0 : rules.totalAlunos(matriculas)) * totalAtividades;
    }

    private long corrigidas(List<SubmissaoAvaliativa> submissoes) {
        return submissoes.stream().filter(submissao -> submissao.getCorrecao() != null).count();
    }

    private boolean dentroDoPeriodo(
            java.time.LocalDateTime data,
            LocalDate dataInicio,
            LocalDate dataFim) {
        return rules.dentroDoPeriodo(data, dataInicio, dataFim);
    }
}
