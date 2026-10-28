package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CriarAtividadeAvaliativaRequest;
import com.sabia.pedagogico.dto.request.EditarAtividadeRequest;
import com.sabia.pedagogico.dto.response.AtividadeAvaliativaAlunoResponse;
import com.sabia.pedagogico.dto.response.AtividadeAvaliativaProfessorResponse;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.AtividadeNaoEncontradaException;
import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.mapper.AtividadeAvaliativaMapper;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.atividade.StatusAtividade;
import com.sabia.pedagogico.model.atividade.StatusAtividadeAluno;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AtividadeAvaliativaService {

    private final AtividadeAvaliativaRepository atividadeRepository;
    private final TurmaRepository turmaRepository;
    private final TurmaAlunoRepository turmaAlunoRepository;
    private final AtividadeAvaliativaMapper atividadeAvaliativaMapper;
    private final SubmissaoAvaliativaRepository submissaoAvaliativaRepository;
    private final CenarioRoboValidador cenarioRoboValidador;

    // --------- PROFESSOR ---------

    public List<AtividadeAvaliativaProfessorResponse> listarDosProfessor(Long professorId, Long turmaId, StatusAtividade status) {
        List<AtividadeAvaliativa> resultado;
        if (turmaId != null && status != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndTurmaIdAndStatus(professorId, turmaId, status);
        } else if (turmaId != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndTurmaId(professorId, turmaId);
        } else if (status != null) {
            resultado = atividadeRepository.findByTurma_ProfessorIdAndStatus(professorId, status);
        } else {
            resultado = atividadeRepository.findByTurma_ProfessorId(professorId);
        }
        return atividadeAvaliativaMapper.toProfessorResponseList(resultado);
    }

    @Transactional
    public AtividadeAvaliativaProfessorResponse criar(Long professorId, CriarAtividadeAvaliativaRequest request) {
        var turma = turmaRepository.findById(request.turmaId())
                .orElseThrow(() -> new OperacaoInvalidaException("Turma não encontrada."));

        if (!turma.getProfessorId().equals(professorId)) {
            throw new AcessoNegadoException("Esta turma não pertence ao seu perfil.");
        }



        var atividade = AtividadeAvaliativa.builder()
                .turma(turma)
                .titulo(request.titulo())
                .descricao(request.descricao())
                .dataEntrega(request.dataEntrega())
                .pontuacaoMaxima(request.pontuacaoMaxima())
                .status(request.status())
                .gabaritoEstadoJson(request.gabaritoEstadoJson())
                .modo(request.modo())
                .cenarioJson(cenarioDoModo(request.modo(), request.cenarioJson()))
                .build();

        atividade = atividadeRepository.save(atividade);
        log.info("Atividade criada id={} por professor id={}", atividade.getId(), professorId);
        return atividadeAvaliativaMapper.toProfessorResponse(atividade);
    }

    public AtividadeAvaliativaProfessorResponse buscarParaProfessor(Long professorId, Long atividadeId) {
        return atividadeAvaliativaMapper.toProfessorResponse(validarProprietario(professorId, atividadeId));
    }

    @Transactional
    public AtividadeAvaliativaProfessorResponse editar(Long professorId, Long atividadeId, EditarAtividadeRequest request) {
        var atividade = validarProprietario(professorId, atividadeId);

        if (request.titulo() != null)         atividade.setTitulo(request.titulo());
        if (request.descricao() != null)      atividade.setDescricao(request.descricao());
        if (request.pontuacaoMaxima() != null) atividade.setPontuacaoMaxima(request.pontuacaoMaxima());
        if (request.dataEntrega() != null)    atividade.setDataEntrega(request.dataEntrega());
        if (request.gabaritoEstadoJson() != null)     atividade.setGabaritoEstadoJson(request.gabaritoEstadoJson());

        if (request.modo() != null || request.cenarioJson() != null) {
            var modo = request.modo() != null ? request.modo() : atividade.getModo();
            var cenario = cenarioDoModo(modo,
                    request.cenarioJson() != null ? request.cenarioJson() : atividade.getCenarioJson());
            if (!mesmoCenario(atividade.getCenarioJson(), cenario)
                    && submissaoAvaliativaRepository.existsByAtividadeId(atividadeId)) {
                throw new ConflitoException("Não é possível alterar o cenário: a atividade já tem submissões.");
            }
            atividade.setModo(modo);
            atividade.setCenarioJson(cenario);
        }

        return atividadeAvaliativaMapper.toProfessorResponse(atividadeRepository.save(atividade));
    }

    @Transactional
    public AtividadeAvaliativaProfessorResponse publicar(Long professorId, Long atividadeId) {
        var atividade = validarProprietario(professorId, atividadeId);
        if (atividade.getStatus() == StatusAtividade.PUBLICADA) {
            throw new OperacaoInvalidaException("Atividade já está publicada.");
        }
        atividade.setStatus(StatusAtividade.PUBLICADA);
        log.info("Atividade id={} publicada", atividadeId);
        return atividadeAvaliativaMapper.toProfessorResponse(atividadeRepository.save(atividade));
    }

    @Transactional
    public AtividadeAvaliativaProfessorResponse despublicar(Long professorId, Long atividadeId) {
        var atividade = validarProprietario(professorId, atividadeId);
        if (atividade.getStatus() == StatusAtividade.RASCUNHO) {
            throw new OperacaoInvalidaException("Atividade já está como rascunho.");
        }
        atividade.setStatus(StatusAtividade.RASCUNHO);
        log.info("Atividade id={} despublicada", atividadeId);
        return atividadeAvaliativaMapper.toProfessorResponse(atividadeRepository.save(atividade));
    }

    // --------- ALUNO ---------

    public List<AtividadeAvaliativaAlunoResponse> listarPublicadasParaAluno(Long alunoId) {
        List<Long> turmaIds = turmaAlunoRepository.findByAlunoId(alunoId).stream()
                .map(ta -> ta.getTurma().getId())
                .toList();

        if (turmaIds.isEmpty()) return List.of();

        List<AtividadeAvaliativa> atividades =
                atividadeRepository.findByTurmaIdInAndStatus(turmaIds, StatusAtividade.PUBLICADA);

        Map<Long, SubmissaoAvaliativa> submissaoPorAtividade =
                submissaoAvaliativaRepository.findByAlunoId(alunoId).stream()
                        .collect(Collectors.toMap(s -> s.getAtividade().getId(), s -> s));

        return atividades.stream().map(a -> toAlunoResponse(a, submissaoPorAtividade.get(a.getId()))).toList();
    }

    public AtividadeAvaliativaAlunoResponse buscarParaAluno(Long alunoId, Long atividadeId) {
        var atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AtividadeNaoEncontradaException(atividadeId));

        if (atividade.getStatus() != StatusAtividade.PUBLICADA) {
            throw new AcessoNegadoException("Esta atividade não está disponível.");
        }
        if (!turmaAlunoRepository.existsByTurmaIdAndAlunoId(atividade.getTurma().getId(), alunoId)) {
            throw new AcessoNegadoException("Você não está matriculado nesta turma.");
        }

        SubmissaoAvaliativa sub = submissaoAvaliativaRepository
                .findByAlunoIdAndAtividadeId(alunoId, atividadeId).orElse(null);
        return toAlunoResponse(atividade, sub);
    }

    private AtividadeAvaliativaAlunoResponse toAlunoResponse(AtividadeAvaliativa a, SubmissaoAvaliativa sub) {
        StatusAtividadeAluno statusAluno;
        if (sub == null) {
            statusAluno = StatusAtividadeAluno.PENDENTE;
        } else if (sub.getStatus() == StatusSubmissao.CORRIGIDA) {
            statusAluno = StatusAtividadeAluno.CORRIGIDA;
        } else {
            statusAluno = StatusAtividadeAluno.ENTREGUE;
        }
        return new AtividadeAvaliativaAlunoResponse(
                a.getId(), a.getTitulo(), a.getDescricao(),
                a.getTurma().getId(), a.getPontuacaoMaxima(),
                a.getDataEntrega(), a.isEGeradaIa(),
                statusAluno, a.getCriadaEm(),
                a.getModo() != null ? a.getModo() : ModoAtividade.BLOCOS,
                a.getCenarioJson()
        );
    }

    @Transactional
    public void deletar(Long professorId, Long atividadeId) {
        var atividade = validarProprietario(professorId, atividadeId);
        atividadeRepository.delete(atividade);
    }

    // --------- helpers ---------

    private String cenarioDoModo(ModoAtividade modo, String cenarioJson) {
        if (modo != ModoAtividade.JOGO_ROBO) return null;
        if (cenarioJson == null || cenarioJson.isBlank()) {
            throw new CenarioInvalidoException("Atividades no modo Jogo do Robô precisam de um cenário.");
        }
        cenarioRoboValidador.validar(cenarioJson);
        return cenarioJson;
    }

    private boolean mesmoCenario(String atual, String novo) {
        if (atual == null || novo == null) return Objects.equals(atual, novo);
        return cenarioRoboValidador.ler(atual).equals(cenarioRoboValidador.ler(novo));
    }

    private AtividadeAvaliativa validarProprietario(Long professorId, Long atividadeId) {
        var atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new AtividadeNaoEncontradaException(atividadeId));
        if (!atividade.getTurma().getProfessorId().equals(professorId)) {
            throw new AcessoNegadoException("Esta atividade não pertence ao seu perfil.");
        }
        return atividade;
    }
}
