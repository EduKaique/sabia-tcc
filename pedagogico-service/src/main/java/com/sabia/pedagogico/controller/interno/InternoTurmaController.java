package com.sabia.pedagogico.controller.interno;

import com.sabia.pedagogico.dto.request.MatricularAlunoRequest;
import com.sabia.pedagogico.dto.response.TurmaAlunoResponse;
import com.sabia.pedagogico.dto.response.TurmaPorCodigoResponse;
import com.sabia.pedagogico.service.TurmaAlunoService;
import com.sabia.pedagogico.service.TurmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints serviço-a-serviço, chamados pelo auth-service com token de perfil SISTEMA
 * (primeiro acesso do aluno). Bloqueados no API Gateway: nunca expostos ao front.
 */
@RestController
@RequestMapping("/api/interno/turmas")
@RequiredArgsConstructor
@Tag(name = "Interno — Turmas")
@SecurityRequirement(name = "bearerAuth")
public class InternoTurmaController {

    private final TurmaService turmaService;
    private final TurmaAlunoService turmaAlunoService;

    @GetMapping("/por-codigo/{codigo}")
    @Operation(summary = "Busca a turma pelo código de convite (uso interno)")
    public ResponseEntity<TurmaPorCodigoResponse> buscarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(turmaService.buscarPorCodigoInterno(codigo));
    }

    @PostMapping("/{turmaId}/alunos")
    @Operation(summary = "Vincula aluno à turma sem checagem de professor (uso interno)")
    public ResponseEntity<TurmaAlunoResponse> matricular(
            @PathVariable Long turmaId,
            @Valid @RequestBody MatricularAlunoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turmaAlunoService.matricularPeloSistema(turmaId, request));
    }
}
