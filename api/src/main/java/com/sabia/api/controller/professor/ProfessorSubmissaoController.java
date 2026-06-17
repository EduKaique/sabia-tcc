package com.sabia.api.controller.professor;

import com.sabia.api.dto.request.AvaliarSubmissaoRequest;
import com.sabia.api.dto.response.SubmissaoResponse;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.SubmissaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professor/submissoes")
@RequiredArgsConstructor
@Tag(name = "Professor — Submissões")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorSubmissaoController {

    private final SubmissaoService submissaoService;

    @GetMapping("/pendentes")
    @Operation(summary = "Lista submissões pendentes das turmas do professor")
    public ResponseEntity<List<SubmissaoResponse>> listarPendentes(Authentication auth) {
        return ResponseEntity.ok(submissaoService.listarPendentesParaProfessor(professorId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da submissão com avaliação (se existir)")
    public ResponseEntity<SubmissaoResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(submissaoService.buscarParaProfessor(professorId(auth), id));
    }

    @PostMapping("/{id}/avaliar")
    @Operation(summary = "Salva nota e feedback. Muda status para CORRIGIDA")
    public ResponseEntity<SubmissaoResponse> avaliar(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AvaliarSubmissaoRequest request) {
        return ResponseEntity.ok(submissaoService.avaliar(professorId(auth), id, request));
    }

    private Long professorId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
