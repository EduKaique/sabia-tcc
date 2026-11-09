package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.request.EstadoLicaoRequest;
import com.sabia.pedagogico.dto.response.LicaoDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.LicaoService;
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
@RequestMapping("/api/aluno/licoes")
@RequiredArgsConstructor
@Tag(name = "Aluno — Lições")
@SecurityRequirement(name = "bearerAuth")
public class AlunoLicaoController {

    private final LicaoService licaoService;

    @GetMapping
    @Operation(summary = "Lista as lições ativas, em ordem, com o progresso do aluno")
    public ResponseEntity<List<LicaoResumoResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(licaoService.listarParaAluno(alunoId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da lição com progresso e último estado do workspace")
    public ResponseEntity<LicaoDetalheResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.buscarParaAluno(alunoId(auth), id));
    }

    @PostMapping("/{id}/video-visto")
    @Operation(summary = "Marca o vídeo da lição como visto")
    public ResponseEntity<ProgressoLicaoResponse> marcarVideoVisto(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.marcarVideoVisto(alunoId(auth), id));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Salva o estado do workspace (autosave)")
    public ResponseEntity<ProgressoLicaoResponse> salvarEstado(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody EstadoLicaoRequest request) {
        return ResponseEntity.ok(licaoService.salvarEstado(alunoId(auth), id, request.estadoJson()));
    }

    @PostMapping("/{id}/concluir-atividade")
    @Operation(summary = "Marca a prática da lição como concluída")
    public ResponseEntity<ProgressoLicaoResponse> concluirAtividade(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody EstadoLicaoRequest request) {
        return ResponseEntity.ok(licaoService.concluirAtividade(alunoId(auth), id, request.estadoJson()));
    }

    private Long alunoId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
