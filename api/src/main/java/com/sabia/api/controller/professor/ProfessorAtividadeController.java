package com.sabia.api.controller.professor;

import com.sabia.api.dto.request.CriarAtividadeAvaliativaRequest;
import com.sabia.api.dto.request.EditarAtividadeRequest;
import com.sabia.api.dto.response.AtividadeAvaliativaProfessorResponse;
import com.sabia.api.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.api.model.atividade.StatusAtividade;
import com.sabia.api.model.atividade.StatusSubmissao;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.AtividadeAvaliativaService;
import com.sabia.api.service.SubmissaoAvaliativaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professor/atividades")
@RequiredArgsConstructor
@Tag(name = "Professor — Atividades")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorAtividadeController {

    private final AtividadeAvaliativaService atividadeAvaliativaService;
    private final SubmissaoAvaliativaService submissaoAvaliativaService;

    @GetMapping
    @Operation(summary = "Lista atividades do professor autenticado")
    public ResponseEntity<List<AtividadeAvaliativaProfessorResponse>> listar(
            Authentication auth,
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) StatusAtividade status) {
        return ResponseEntity.ok(atividadeAvaliativaService.listarDosProfessor(professorId(auth), turmaId, status));
    }

    @PostMapping
    @Operation(summary = "Cria nova atividade (status inicial: RASCUNHO)")
    public ResponseEntity<AtividadeAvaliativaProfessorResponse> criar(
            Authentication auth,
            @Valid @RequestBody CriarAtividadeAvaliativaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atividadeAvaliativaService.criar(professorId(auth), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da atividade")
    public ResponseEntity<AtividadeAvaliativaProfessorResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.buscarParaProfessor(professorId(auth), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita atividade")
    public ResponseEntity<AtividadeAvaliativaProfessorResponse> editar(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody EditarAtividadeRequest request) {
        return ResponseEntity.ok(atividadeAvaliativaService.editar(professorId(auth), id, request));
    }

    @PatchMapping("/{id}/publicar")
    @Operation(summary = "Publica atividade (RASCUNHO → PUBLICADA)")
    public ResponseEntity<AtividadeAvaliativaProfessorResponse> publicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.publicar(professorId(auth), id));
    }

    @PatchMapping("/{id}/despublicar")
    @Operation(summary = "Despublica atividade (PUBLICADA → RASCUNHO)")
    public ResponseEntity<AtividadeAvaliativaProfessorResponse> despublicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.despublicar(professorId(auth), id));
    }

    @GetMapping("/{id}/submissoes")
    @Operation(summary = "Lista submissões pendentes das turmas do professor")
    public ResponseEntity<List<SubmissaoAvaliativaResponse>> listarSubmissoesDaAtividade(Authentication auth, @PathVariable Long id,
        @RequestParam(required = false) StatusSubmissao status) {
        return ResponseEntity.ok(submissaoAvaliativaService.listarSubmissoesPorAtividade(id, professorId(auth), status));
    }

    private Long professorId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
