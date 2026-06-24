package com.sabia.api.controller.professor;

import com.sabia.api.dto.request.AvaliarSubmissaoRequest;
import com.sabia.api.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.SubmissaoAvaliativaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/professor/submissoes")
@RequiredArgsConstructor
@Tag(name = "Professor — Submissões")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorSubmissaoController {

    private final SubmissaoAvaliativaService submissaoAvaliativaService;

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da submissão com avaliação (se existir)")
    public ResponseEntity<SubmissaoAvaliativaResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(submissaoAvaliativaService.buscarParaProfessor(professorId(auth), id));
    }

    @PostMapping("/{id}/corrigir")
    @Operation(summary = "Salva nota e feedback. Muda status para CORRIGIDA")
    public ResponseEntity<SubmissaoAvaliativaResponse> corrigir(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AvaliarSubmissaoRequest request) {
        return ResponseEntity.ok(submissaoAvaliativaService.corrigir(professorId(auth), id, request));
    }

    private Long professorId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
