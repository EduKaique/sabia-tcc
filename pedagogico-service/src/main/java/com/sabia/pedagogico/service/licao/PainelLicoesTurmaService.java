package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse.AlunoLinha;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse.Celula;
import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse.LicaoColuna;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Painel do professor: alunos matriculados x lições publicadas da turma. Número fixo de consultas (turma, lições,
 * alunos, páginas e os dois progressos), independente de quantos alunos e lições; o resto é calculado aqui, com
 * as mesmas regras da listagem do aluno ({@link ProgressoLicaoRegras}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PainelLicoesTurmaService {

    private final TurmaRepository turmaRepository;
    private final LicaoTurmaRepository licaoTurmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final PaginaLicaoRepository paginaRepository;
    private final ProgressoPaginaRepository progressoPaginaRepository;
    private final ProgressoLicaoRepository progressoLicaoRepository;

    public ProgressoLicoesTurmaResponse progresso(Long professorId, Long turmaId) {
        // Mesmo tratamento dos endpoints de turma: inexistente ou de outro professor -> 404.
        Turma turma = turmaRepository.findByIdAndProfessorId(turmaId, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada."));

        // O JPQL já filtra e ordena; repetir em Java é barato e deixa a regra explícita e testável sem banco.
        List<Licao> licoes = licaoTurmaRepository.findPublicadasDaTurma(turmaId).stream()
                .map(LicaoTurma::getLicao)
                .filter(l -> l.getStatus() == StatusLicao.ATIVA && l.getPublicadaEm() != null)
                .distinct()
                .sorted(Comparator.comparing(Licao::getPublicadaEm).thenComparing(Licao::getId))
                .toList();
        List<TurmaAluno> matriculas = turmaAlunoRepository.findByTurmaId(turmaId).stream()
                .sorted(ordemAlunos()).toList();

        List<Long> licaoIds = licoes.stream().map(Licao::getId).toList();
        List<PaginaLicao> paginas = licaoIds.isEmpty() ? List.of() : paginaRepository.findByLicaoIdIn(licaoIds);
        Map<Long, List<PaginaLicao>> paginasPorLicao = paginas.stream()
                .collect(Collectors.groupingBy(p -> p.getLicao().getId()));

        boolean consultarProgresso = !matriculas.isEmpty() && !licaoIds.isEmpty();
        Map<Long, Map<Long, ProgressoPagina>> paginasPorAluno = new HashMap<>();
        if (consultarProgresso && !paginas.isEmpty()) {
            for (ProgressoPagina pp : progressoPaginaRepository.findDaTurmaPorPaginas(turmaId,
                    paginas.stream().map(PaginaLicao::getId).toList())) {
                paginasPorAluno.computeIfAbsent(pp.getAlunoId(), k -> new HashMap<>())
                        .put(pp.getPagina().getId(), pp);
            }
        }
        Map<Long, Map<Long, ProgressoLicao>> licoesPorAluno = new HashMap<>();
        if (consultarProgresso) {
            for (ProgressoLicao pl : progressoLicaoRepository.findDaTurmaPorLicoes(turmaId, licaoIds)) {
                licoesPorAluno.computeIfAbsent(pl.getAlunoId(), k -> new HashMap<>())
                        .put(pl.getLicao().getId(), pl);
            }
        }

        Map<Long, Integer> concluiram = new LinkedHashMap<>();
        licaoIds.forEach(id -> concluiram.put(id, 0));
        List<AlunoLinha> alunos = new ArrayList<>(matriculas.size());
        for (TurmaAluno ta : matriculas) {
            Map<Long, ProgressoPagina> porPagina = paginasPorAluno.getOrDefault(ta.getAlunoId(), Map.of());
            Map<Long, ProgressoLicao> porLicao = licoesPorAluno.getOrDefault(ta.getAlunoId(), Map.of());
            List<Celula> celulas = new ArrayList<>(licoes.size());
            for (Licao l : licoes) {
                Celula c = celula(l.getId(), paginasPorLicao.getOrDefault(l.getId(), List.of()), porPagina,
                        porLicao.get(l.getId()));
                if (c.estado() == EstadoLicaoAluno.CONCLUIDA) concluiram.merge(l.getId(), 1, Integer::sum);
                celulas.add(c);
            }
            alunos.add(new AlunoLinha(ta.getAlunoId(), nome(ta), celulas));
        }

        List<LicaoColuna> colunas = licoes.stream()
                .map(l -> new LicaoColuna(l.getId(), l.getTitulo(), l.getConceito(), l.getModo(),
                        paginasPorLicao.getOrDefault(l.getId(), List.of()).size(), l.getPublicadaEm(),
                        concluiram.get(l.getId())))
                .toList();
        log.debug("Painel de lições: turma={} professor={} licoes={} alunos={}",
                turmaId, professorId, colunas.size(), alunos.size());
        return new ProgressoLicoesTurmaResponse(turma.getId(), turma.getNome(), alunos.size(), colunas, alunos);
    }

    /** Uma célula com as regras da listagem do aluno; páginas da lição em qualquer ordem. */
    static Celula celula(Long licaoId, List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina,
                         ProgressoLicao pl) {
        return new Celula(licaoId,
                ProgressoLicaoRegras.estado(paginas, porPagina, pl),
                ProgressoLicaoRegras.paginasConcluidas(paginas, porPagina),
                mediaQuestionarios(paginas, porPagina),
                pl != null && pl.isAtividadeConcluida(),
                pl != null ? pl.getConcluidaEm() : null);
    }

    /** Média inteira dos melhores percentuais dos questionários já tentados; nulo se nenhum foi tentado. */
    static Integer mediaQuestionarios(List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina) {
        int soma = 0;
        int quantos = 0;
        for (PaginaLicao p : paginas) {
            if (p.getTipo() != TipoPagina.QUESTIONARIO) continue;
            ProgressoPagina pp = porPagina.get(p.getId());
            if (pp == null || pp.getMelhorPercentual() == null) continue;
            soma += pp.getMelhorPercentual();
            quantos++;
        }
        return quantos == 0 ? null : soma / quantos;
    }

    private static String nome(TurmaAluno ta) {
        String nome = ta.getAlunoNome();
        return nome == null || nome.isBlank() ? "Aluno " + ta.getAlunoId() : nome;
    }

    /** Nome sem diferenciar maiúsculas e acentos (pt-BR); empate por id. */
    private static Comparator<TurmaAluno> ordemAlunos() {
        Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        collator.setStrength(Collator.PRIMARY);
        return Comparator.<TurmaAluno, String>comparing(PainelLicoesTurmaService::nome, collator)
                .thenComparing(TurmaAluno::getAlunoId);
    }
}
