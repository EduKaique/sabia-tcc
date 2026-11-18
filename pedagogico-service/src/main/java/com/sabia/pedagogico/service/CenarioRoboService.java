package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CenarioRoboRequest;
import com.sabia.pedagogico.dto.response.CenarioRoboResponse;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.robo.CenarioRobo;
import com.sabia.pedagogico.repository.CenarioRoboRepository;
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
public class CenarioRoboService {

    static final int LIMITE_POR_PROFESSOR = 50;

    private final CenarioRoboRepository cenarioRoboRepository;
    private final CenarioRoboValidador cenarioRoboValidador;

    public List<CenarioRoboResponse> listarDoProfessor(Long professorId) {
        return cenarioRoboRepository.findByProfessorIdOrderByAtualizadoEmDesc(professorId).stream()
                .map(CenarioRoboResponse::from)
                .toList();
    }

    public CenarioRoboResponse buscar(Long professorId, Long id) {
        return CenarioRoboResponse.from(buscarDoProfessor(professorId, id));
    }

    @Transactional
    public CenarioRoboResponse criar(Long professorId, CenarioRoboRequest request) {
        cenarioRoboValidador.validar(request.cenarioJson());
        if (cenarioRoboRepository.countByProfessorId(professorId) >= LIMITE_POR_PROFESSOR) {
            throw new ConflitoException("Você atingiu o limite de " + LIMITE_POR_PROFESSOR
                    + " cenários. Exclua algum para criar outro.");
        }
        CenarioRobo cenario = cenarioRoboRepository.save(CenarioRobo.builder()
                .professorId(professorId)
                .nome(request.nome())
                .cenarioJson(request.cenarioJson())
                .build());
        log.info("Cenário do robô criado id={} por professor id={}", cenario.getId(), professorId);
        return CenarioRoboResponse.from(cenario);
    }

    @Transactional
    public CenarioRoboResponse atualizar(Long professorId, Long id, CenarioRoboRequest request) {
        CenarioRobo cenario = buscarDoProfessor(professorId, id);
        cenarioRoboValidador.validar(request.cenarioJson());
        cenario.setNome(request.nome());
        cenario.setCenarioJson(request.cenarioJson());
        // saveAndFlush dispara o @PreUpdate e devolve atualizadoEm já preenchido.
        CenarioRobo salvo = cenarioRoboRepository.saveAndFlush(cenario);
        log.info("Cenário do robô id={} atualizado por professor id={}", id, professorId);
        return CenarioRoboResponse.from(salvo);
    }

    @Transactional
    public void excluir(Long professorId, Long id) {
        CenarioRobo cenario = buscarDoProfessor(professorId, id);
        cenarioRoboRepository.delete(cenario);
        log.info("Cenário do robô id={} excluído por professor id={}", id, professorId);
    }

    private CenarioRobo buscarDoProfessor(Long professorId, Long id) {
        return cenarioRoboRepository.findByIdAndProfessorId(id, professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Cenário não encontrado."));
    }
}
