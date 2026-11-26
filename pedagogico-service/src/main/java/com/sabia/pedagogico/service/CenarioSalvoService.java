package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CenarioRoboRequest;
import com.sabia.pedagogico.dto.response.CenarioRoboResponse;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.robo.CenarioSalvo;
import com.sabia.pedagogico.repository.CenarioSalvoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Biblioteca de cenários do Jogo do Robô de cada professor. O dono vem sempre do token; cenário de
 * outro professor responde 404, como se não existisse.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class CenarioSalvoService {

    static final int LIMITE_POR_PROFESSOR = 50;

    private final CenarioSalvoRepository cenarioSalvoRepository;
    private final CenarioRoboValidador cenarioRoboValidador;

    public List<CenarioRoboResponse> listarDoProfessor(Long professorId) {
        return cenarioSalvoRepository.findByProfessorIdOrderByAtualizadoEmDesc(professorId).stream()
                .map(CenarioRoboResponse::from)
                .toList();
    }

    public CenarioRoboResponse buscar(Long professorId, Long id) {
        return CenarioRoboResponse.from(buscarDoProfessor(professorId, id));
    }

    @Transactional
    public CenarioRoboResponse criar(Long professorId, CenarioRoboRequest request) {
        cenarioRoboValidador.validar(request.cenarioJson());
        if (cenarioSalvoRepository.countByProfessorId(professorId) >= LIMITE_POR_PROFESSOR) {
            throw new ConflitoException("Você atingiu o limite de " + LIMITE_POR_PROFESSOR
                    + " cenários. Exclua algum para criar outro.");
        }
        CenarioSalvo cenario = cenarioSalvoRepository.save(CenarioSalvo.builder()
                .professorId(professorId)
                .nome(request.nome())
                .cenarioJson(request.cenarioJson())
                .build());
        log.info("Cenário do robô criado id={} por professor id={}", cenario.getId(), professorId);
        return CenarioRoboResponse.from(cenario);
    }

    @Transactional
    public CenarioRoboResponse atualizar(Long professorId, Long id, CenarioRoboRequest request) {
        CenarioSalvo cenario = buscarDoProfessor(professorId, id);
        cenarioRoboValidador.validar(request.cenarioJson());
        cenario.setNome(request.nome());
        cenario.setCenarioJson(request.cenarioJson());
        // saveAndFlush dispara o @PreUpdate e devolve atualizadoEm já preenchido.
        CenarioSalvo salvo = cenarioSalvoRepository.saveAndFlush(cenario);
        log.info("Cenário do robô id={} atualizado por professor id={}", id, professorId);
        return CenarioRoboResponse.from(salvo);
    }

    @Transactional
    public void excluir(Long professorId, Long id) {
        CenarioSalvo cenario = buscarDoProfessor(professorId, id);
        cenarioSalvoRepository.delete(cenario);
        log.info("Cenário do robô id={} excluído por professor id={}", id, professorId);
    }

    private CenarioSalvo buscarDoProfessor(Long professorId, Long id) {
        return cenarioSalvoRepository.findByIdAndProfessorId(id, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Cenário não encontrado."));
    }
}
