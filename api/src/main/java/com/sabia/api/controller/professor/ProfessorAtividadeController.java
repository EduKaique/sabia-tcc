package com.sabia.api.controller.professor;

import com.sabia.api.dto.request.CriarAtividadeAvaliativaRequest;
import com.sabia.api.dto.request.EditarAtividadeRequest;
import com.sabia.api.dto.response.AtividadeAvaliativaResponse;
import com.sabia.api.model.atividade.StatusAtividade;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.AtividadeAvaliativaService;
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

    @GetMapping
    @Operation(summary = "Lista atividades do professor autenticado")
    public ResponseEntity<List<AtividadeAvaliativaResponse>> listar(
            Authentication auth,
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) StatusAtividade status) {
        return ResponseEntity.ok(atividadeAvaliativaService.listarDosProfessor(professorId(auth), turmaId, status));
    }

    @PostMapping
    @Operation(summary = "Cria nova atividade (status inicial: RASCUNHO)")
    public ResponseEntity<AtividadeAvaliativaResponse> criar(
            Authentication auth,
            @Valid @RequestBody CriarAtividadeAvaliativaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atividadeAvaliativaService.criar(professorId(auth), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da atividade")
    public ResponseEntity<AtividadeAvaliativaResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.buscarParaProfessor(professorId(auth), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita atividade")
    public ResponseEntity<AtividadeAvaliativaResponse> editar(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody EditarAtividadeRequest request) {
        return ResponseEntity.ok(atividadeAvaliativaService.editar(professorId(auth), id, request));
    }

    @PatchMapping("/{id}/publicar")
    @Operation(summary = "Publica atividade (RASCUNHO → PUBLICADA)")
    public ResponseEntity<AtividadeAvaliativaResponse> publicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.publicar(professorId(auth), id));
    }

    @PatchMapping("/{id}/despublicar")
    @Operation(summary = "Despublica atividade (PUBLICADA → RASCUNHO)")
    public ResponseEntity<AtividadeAvaliativaResponse> despublicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.despublicar(professorId(auth), id));
    }

    private Long professorId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
