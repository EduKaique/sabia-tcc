package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.response.ProgressoLicoesTurmaResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.licao.PainelLicoesTurmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Somente leitura: o professor vem sempre do token; turma inexistente ou de outro professor responde 404. */
@RestController
@RequestMapping("/api/professor/turmas/{turmaId}/licoes")
@RequiredArgsConstructor
@Tag(name = "Professor — Lições")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorTurmaLicoesController {

    private final PainelLicoesTurmaService painelService;

    @GetMapping("/progresso")
    @Operation(summary = "Progresso dos alunos matriculados nas lições publicadas da turma")
    public ResponseEntity<ProgressoLicoesTurmaResponse> progresso(Authentication auth, @PathVariable Long turmaId) {
        return ResponseEntity.ok(painelService.progresso(professorId(auth), turmaId));
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
