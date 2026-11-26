package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.AlunoProgresso;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.LicaoInfo;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.PaginaAluno;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.PaginaInfo;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse.TurmaProgresso;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.licao.EstadoPublicacaoLicao;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.model.turma.TurmaAluno;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Relatório de progresso de uma lição do professor: alunos das turmas vinculadas, agrupados por turma, com o
 * resumo (mesma regra da visão do aluno, {@link ProgressoLicaoRegras}) e a situação página a página. Número fixo
 * de consultas (lição, páginas, vínculos, matrículas, progresso das páginas, progresso da lição).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressoLicaoProfessorService {

    private final LicaoRepository licaoRepository;
    private final PaginaLicaoRepository paginaRepository;
    private final LicaoTurmaRepository licaoTurmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final ProgressoPaginaRepository progressoPaginaRepository;
    private final ProgressoLicaoRepository progressoLicaoRepository;

    /** Como nas demais rotas da lição: inexistente -> 404; de outro professor -> 403. */
    public ProgressoLicaoProfessorResponse progresso(Long professorId, Long licaoId) {
        Licao licao = licaoRepository.findById(licaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Lição com id " + licaoId + " não encontrada."));
        if (!professorId.equals(licao.getProfessorId())) {
            throw new AcessoNegadoException("Esta lição não pertence ao seu perfil.");
        }

        List<PaginaLicao> paginas = paginaRepository.findByLicaoIdOrderByOrdemAsc(licaoId);
        // Já vem ordenado pelo nome da turma; um mapa preserva a ordem e evita turma repetida.
        Map<Long, Turma> turmas = new LinkedHashMap<>();
        for (LicaoTurma lt : licaoTurmaRepository.findComTurmaByLicaoIdIn(List.of(licaoId))) {
            turmas.putIfAbsent(lt.getTurma().getId(), lt.getTurma());
        }
        List<TurmaAluno> matriculas = turmas.isEmpty() ? List.of()
                : turmaAlunoRepository.findByTurmaIdIn(turmas.keySet());
        Set<Long> alunoIds = matriculas.stream().map(TurmaAluno::getAlunoId).collect(Collectors.toSet());

        Map<Long, Map<Long, ProgressoPagina>> paginasPorAluno = new HashMap<>();
        Map<Long, ProgressoLicao> licaoPorAluno = new HashMap<>();
        if (!alunoIds.isEmpty()) {
            if (!paginas.isEmpty()) {
                for (ProgressoPagina pp : progressoPaginaRepository.findByPaginaIdInAndAlunoIdIn(
                        paginas.stream().map(PaginaLicao::getId).toList(), alunoIds)) {
                    paginasPorAluno.computeIfAbsent(pp.getAlunoId(), k -> new HashMap<>())
                            .put(pp.getPagina().getId(), pp);
                }
            }
            for (ProgressoLicao pl : progressoLicaoRepository.findByLicaoIdAndAlunoIdIn(licaoId, alunoIds)) {
                licaoPorAluno.put(pl.getAlunoId(), pl);
            }
        }

        Map<Long, List<TurmaAluno>> matriculasPorTurma = matriculas.stream()
                .collect(Collectors.groupingBy(ta -> ta.getTurma().getId()));
        Set<Long> concluiram = new HashSet<>();
        List<TurmaProgresso> grupos = new ArrayList<>(turmas.size());
        for (Turma t : turmas.values()) {
            List<AlunoProgresso> alunos = matriculasPorTurma.getOrDefault(t.getId(), List.of()).stream()
                    .sorted(ordemAlunos())
                    .map(ta -> aluno(ta, paginas, paginasPorAluno.getOrDefault(ta.getAlunoId(), Map.of()),
                            licaoPorAluno.get(ta.getAlunoId())))
                    .toList();
            alunos.stream().filter(a -> a.estado() == EstadoLicaoAluno.CONCLUIDA)
                    .forEach(a -> concluiram.add(a.alunoId()));
            grupos.add(new TurmaProgresso(t.getId(), t.getNome(), alunos));
        }

        log.debug("Relatório da lição: licao={} professor={} turmas={} alunos={}",
                licaoId, professorId, grupos.size(), alunoIds.size());
        return new ProgressoLicaoProfessorResponse(
                new LicaoInfo(licao.getId(), licao.getTitulo(), licao.getConceito(), licao.getModo(),
                        EstadoPublicacaoLicao.de(licao), licao.getPublicadaEm()),
                paginas.stream().map(p -> new PaginaInfo(p.getId(), p.getOrdem(), p.getTipo(), p.getTitulo())).toList(),
                alunoIds.size(), concluiram.size(), grupos);
    }

    /** Resumo com as regras da listagem do aluno e a situação de cada página, na ordem das páginas. */
    static AlunoProgresso aluno(TurmaAluno ta, List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina,
                                ProgressoLicao pl) {
        List<PaginaAluno> situacao = paginas.stream().map(p -> {
            ProgressoPagina pp = porPagina.get(p.getId());
            boolean tentou = p.getTipo() == TipoPagina.QUESTIONARIO && pp != null && pp.getMelhorPercentual() != null;
            return new PaginaAluno(p.getId(), ProgressoLicaoRegras.paginaConcluida(p, pp),
                    tentou ? pp.getMelhorPercentual() : null,
                    tentou ? (pp.getTentativas() != null ? pp.getTentativas() : 0) : null);
        }).toList();
        return new AlunoProgresso(ta.getAlunoId(), nome(ta),
                ProgressoLicaoRegras.estado(paginas, porPagina, pl),
                ProgressoLicaoRegras.paginasConcluidas(paginas, porPagina),
                mediaQuestionarios(paginas, porPagina),
                pl != null && pl.isAtividadeConcluida(),
                pl != null ? pl.getConcluidaEm() : null,
                situacao);
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
        return Comparator.<TurmaAluno, String>comparing(ProgressoLicaoProfessorService::nome, collator)
                .thenComparing(TurmaAluno::getAlunoId);
    }
}
