package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.request.EntrarTurmaRequest;
import com.sabia.pedagogico.dto.response.TurmaDoAlunoResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.TurmaAlunoService;
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
@RequestMapping("/api/aluno/turmas")
@RequiredArgsConstructor
@Tag(name = "Aluno — Turmas")
@SecurityRequirement(name = "bearerAuth")
public class AlunoTurmaController {

    private final TurmaAlunoService turmaAlunoService;

    @GetMapping
    @Operation(summary = "Lista as turmas do aluno")
    public ResponseEntity<List<TurmaDoAlunoResponse>> listar(Authentication auth) {
        AuthenticatedUser aluno = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.ok(turmaAlunoService.listarDoAluno(aluno.id()));
    }

    @PostMapping("/entrar")
    @Operation(summary = "Entra numa turma pelo código de convite (só para aluno sem turma)")
    public ResponseEntity<TurmaDoAlunoResponse> entrar(Authentication auth,
                                                       @Valid @RequestBody EntrarTurmaRequest request) {
        AuthenticatedUser aluno = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turmaAlunoService.entrarPorCodigo(aluno.id(), aluno.nome(), request.codigo()));
    }
}
