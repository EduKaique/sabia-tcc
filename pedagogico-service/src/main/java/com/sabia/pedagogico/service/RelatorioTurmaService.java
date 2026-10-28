package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.DistribuicaoNotasResponse;
import com.sabia.pedagogico.dto.response.MediaAtividadeResponse;
import com.sabia.pedagogico.dto.response.ProgressaoTurmaResponse;
import com.sabia.pedagogico.dto.response.StatusEntregasResponse;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.StatusAtividade;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.service.regras.RelatorioRules;
import com.sabia.pedagogico.service.regras.RelatorioTurmaRules;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/** Dados de entrada dos gráficos do relatório de uma turma (apenas atividades publicadas). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RelatorioTurmaService {

    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AtividadeAvaliativaRepository atividadeRepository;
    private final SubmissaoAvaliativaRepository submissaoRepository;
    private final RelatorioRules relatorioRules;
    private final RelatorioTurmaRules rules;

    public List<MediaAtividadeResponse> mediasPorAtividade(
            Long professorId, Long turmaId, Long atividadeId, LocalDate dataInicio, LocalDate dataFim) {
        var dados = carregar(professorId, turmaId, atividadeId, dataInicio, dataFim);
        return rules.mediasPorAtividade(dados.atividades(), dados.matriculas().size(), dados.submissoes());
    }

    public DistribuicaoNotasResponse distribuicaoNotas(
            Long professorId, Long turmaId, Long atividadeId, LocalDate dataInicio, LocalDate dataFim) {
        var dados = carregar(professorId, turmaId, atividadeId, dataInicio, dataFim);
        var percentuais = rules.percentuaisCorrigidos(dados.submissoes());
        return new DistribuicaoNotasResponse(
                rules.distribuir(percentuais),
                percentuais.size(),
                rules.media(percentuais),
                rules.mediana(percentuais)
        );
    }

    public ProgressaoTurmaResponse progressaoAlunos(
            Long professorId, Long turmaId, Long atividadeId, LocalDate dataInicio, LocalDate dataFim) {
        var dados = carregar(professorId, turmaId, atividadeId, dataInicio, dataFim);
        return rules.progressao(dados.atividades(), dados.matriculas(), dados.submissoes());
    }

    public StatusEntregasResponse statusEntregas(
            Long professorId, Long turmaId, Long atividadeId, LocalDate dataInicio, LocalDate dataFim) {
        var dados = carregar(professorId, turmaId, atividadeId, dataInicio, dataFim);
        return rules.statusEntregas(dados.matriculas().size(), dados.atividades().size(), dados.submissoes());
    }

    private DadosTurma carregar(Long professorId, Long turmaId, Long atividadeId, LocalDate dataInicio, LocalDate dataFim) {
        relatorioRules.validarPeriodo(dataInicio, dataFim);

        turmaRepository.findByIdAndProfessorId(turmaId, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada."));

        List<AtividadeAvaliativa> atividades = atividadeRepository.findByTurmaIdInAndStatus(List.of(turmaId), StatusAtividade.PUBLICADA)
                .stream()
                .filter(a -> relatorioRules.dentroDoPeriodo(a.getCriadaEm(), dataInicio, dataFim))
                .sorted(Comparator.comparing(AtividadeAvaliativa::getCriadaEm).thenComparing(AtividadeAvaliativa::getId))
                .toList();
        if (atividadeId != null) {
            atividades = atividades.stream().filter(a -> a.getId().equals(atividadeId)).toList();
            if (atividades.isEmpty()) {
                throw new ResourceNotFoundException("Atividade não encontrada na turma.");
            }
        }
        var matriculas = turmaAlunoRepository.findByTurmaId(turmaId);

        var ids = atividades.stream().map(AtividadeAvaliativa::getId).toList();
        var submissoes = ids.isEmpty()
                ? List.<SubmissaoAvaliativa>of()
                : submissaoRepository.findByAtividade_IdIn(ids).stream()
                        .filter(s -> relatorioRules.dentroDoPeriodo(s.getDataEnvio(), dataInicio, dataFim))
                        .toList();

        return new DadosTurma(atividades, matriculas, submissoes);
    }

    private record DadosTurma(
            List<AtividadeAvaliativa> atividades,
            List<TurmaAluno> matriculas,
            List<SubmissaoAvaliativa> submissoes) {}
}
