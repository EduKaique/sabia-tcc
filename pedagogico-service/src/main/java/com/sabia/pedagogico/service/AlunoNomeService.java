package com.sabia.pedagogico.service;

import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Mantém os nomes copiados do aluno (matrículas e submissões) em dia com o auth-service. */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlunoNomeService {

    private final TurmaAlunoRepository turmaAlunoRepository;
    private final SubmissaoAvaliativaRepository submissaoRepository;

    /** Idempotente: repetir o mesmo nome só refaz o mesmo UPDATE. */
    @Transactional
    public void atualizarNome(Long alunoId, String nome) {
        int matriculas = turmaAlunoRepository.atualizarNomeAluno(alunoId, nome);
        int submissoes = submissaoRepository.atualizarNomeAluno(alunoId, nome);
        log.info("Nome do aluno id={} atualizado: matriculas={} submissoes={}", alunoId, matriculas, submissoes);
    }
}
