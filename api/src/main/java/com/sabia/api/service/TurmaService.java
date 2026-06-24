package com.sabia.api.service;

import com.sabia.api.dto.response.TurmaResponse;
import com.sabia.api.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TurmaService {

    private final TurmaRepository turmaRepository;

    public List<TurmaResponse> listarDoProfessor(Long professorId) {
        return turmaRepository.findByProfessorId(professorId).stream()
                .map(t -> new TurmaResponse(t.getId(), t.getNome()))
                .toList();
    }
}
