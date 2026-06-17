package com.sabia.api.controller.professor;

import com.sabia.api.domain.activity.StatusAtividade;
import com.sabia.api.domain.user.Usuario;
import com.sabia.api.dto.request.CriarAtividadeRequest;
import com.sabia.api.dto.request.EditarAtividadeRequest;
import com.sabia.api.dto.response.AtividadeResponse;
import com.sabia.api.service.AtividadeService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/professor/atividades")
@RequiredArgsConstructor
@Tag(name = "Professor — Atividades")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorAtividadeController {

    private final AtividadeService atividadeService;

    @GetMapping
    @Operation(summary = "Lista atividades do professor autenticado")
    public ResponseEntity<List<AtividadeResponse>> listar(
            Authentication auth,
            @RequestParam(required = false) UUID turmaId,
            @RequestParam(required = false) StatusAtividade status) {
        return ResponseEntity.ok(atividadeService.listarDosProfessor(professorId(auth), turmaId, status));
    }

    @PostMapping
    @Operation(summary = "Cria nova atividade (status inicial: RASCUNHO)")
    public ResponseEntity<AtividadeResponse> criar(
            Authentication auth,
            @Valid @RequestBody CriarAtividadeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atividadeService.criar(professorId(auth), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da atividade")
    public ResponseEntity<AtividadeResponse> buscar(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(atividadeService.buscarParaProfessor(professorId(auth), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita atividade")
    public ResponseEntity<AtividadeResponse> editar(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody EditarAtividadeRequest request) {
        return ResponseEntity.ok(atividadeService.editar(professorId(auth), id, request));
    }

    @PatchMapping("/{id}/publicar")
    @Operation(summary = "Publica atividade (RASCUNHO → PUBLICADA)")
    public ResponseEntity<AtividadeResponse> publicar(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(atividadeService.publicar(professorId(auth), id));
    }

    @PatchMapping("/{id}/despublicar")
    @Operation(summary = "Despublica atividade (PUBLICADA → RASCUNHO)")
    public ResponseEntity<AtividadeResponse> despublicar(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(atividadeService.despublicar(professorId(auth), id));
    }

    private UUID professorId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
