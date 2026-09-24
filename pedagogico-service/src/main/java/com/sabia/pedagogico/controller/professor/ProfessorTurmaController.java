package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.TurmaRequest;
import com.sabia.pedagogico.dto.response.TurmaResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.TurmaService;
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
@RequestMapping("/api/professor/turmas")
@RequiredArgsConstructor
@Tag(name = "Professor — Turmas")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorTurmaController {

    private final TurmaService turmaService;

    @GetMapping
    @Operation(summary = "Lista turmas do professor autenticado")
    public ResponseEntity<List<TurmaResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(turmaService.listarDoProfessor(professorId(auth)));
    }

    @PostMapping
    @Operation(summary = "Cria turma e gera código de convite")
    public ResponseEntity<TurmaResponse> criar(Authentication auth, @Valid @RequestBody TurmaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(turmaService.criar(professorId(auth), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita turma")
    public ResponseEntity<TurmaResponse> atualizar(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody TurmaRequest request) {
        return ResponseEntity.ok(turmaService.atualizar(professorId(auth), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui turma sem alunos nem atividades vinculados")
    public ResponseEntity<Void> excluir(Authentication auth, @PathVariable Long id) {
        turmaService.excluir(professorId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
