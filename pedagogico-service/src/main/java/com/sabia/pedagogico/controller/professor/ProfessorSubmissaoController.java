package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.AvaliarSubmissaoRequest;
import com.sabia.pedagogico.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.pedagogico.dto.response.SubmissaoProfessorDetalheResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.RelatorioIaSubmissaoService;
import com.sabia.pedagogico.service.SubmissaoAvaliativaService;
import com.sabia.pedagogico.dto.request.RelatorioIaRequest;
import com.sabia.pedagogico.dto.response.RelatorioIaResponse;
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
    private final RelatorioIaSubmissaoService relatorioIaService;

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da submissão com avaliação (se existir)")
    public ResponseEntity<SubmissaoProfessorDetalheResponse> buscar(Authentication auth, @PathVariable Long id) {
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

    @GetMapping("/{id}/relatorio-ia")
    @Operation(summary = "Relatório de IA salvo da submissão (404 se ainda não existir)")
    public ResponseEntity<RelatorioIaResponse> buscarRelatorioIa(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(relatorioIaService.buscar(professorId(auth), id));
    }

    @PutMapping("/{id}/relatorio-ia")
    @Operation(summary = "Cria ou substitui o relatório de IA da submissão")
    public ResponseEntity<RelatorioIaResponse> salvarRelatorioIa(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody RelatorioIaRequest request) {
        return ResponseEntity.ok(relatorioIaService.salvar(professorId(auth), id, request));
    }

    @DeleteMapping("/{id}/relatorio-ia")
    @Operation(summary = "Remove o relatório de IA salvo da submissão")
    public ResponseEntity<Void> removerRelatorioIa(Authentication auth, @PathVariable Long id) {
        relatorioIaService.remover(professorId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
