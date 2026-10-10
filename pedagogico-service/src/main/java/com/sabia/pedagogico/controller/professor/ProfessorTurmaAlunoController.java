package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.MatricularAlunoRequest;
import com.sabia.pedagogico.dto.response.TurmaAlunoResponse;
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
@RequestMapping("/api/professor/turmas/{turmaId}/alunos")
@RequiredArgsConstructor
@Tag(name = "Professor — Matrículas")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorTurmaAlunoController {

    private final TurmaAlunoService turmaAlunoService;

    @GetMapping
    @Operation(summary = "Lista alunos matriculados na turma")
    public ResponseEntity<List<TurmaAlunoResponse>> listar(Authentication auth, @PathVariable Long turmaId) {
        return ResponseEntity.ok(turmaAlunoService.listar(professorId(auth), turmaId));
    }

    @PostMapping
    @Operation(summary = "Matricula aluno na turma")
    public ResponseEntity<TurmaAlunoResponse> matricular(
            Authentication auth,
            @PathVariable Long turmaId,
            @Valid @RequestBody MatricularAlunoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turmaAlunoService.matricular(professorId(auth), turmaId, request));
    }

    @DeleteMapping("/{alunoId}")
    @Operation(summary = "Desmatricula aluno da turma (submissões são mantidas)")
    public ResponseEntity<Void> desmatricular(
            Authentication auth,
            @PathVariable Long turmaId,
            @PathVariable Long alunoId) {
        turmaAlunoService.desmatricular(professorId(auth), turmaId, alunoId);
        return ResponseEntity.noContent().build();
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
