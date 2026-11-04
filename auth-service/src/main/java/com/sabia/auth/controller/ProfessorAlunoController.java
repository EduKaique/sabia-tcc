package com.sabia.auth.controller;

import com.sabia.auth.dto.request.RedefinirSenhaAlunoRequest;
import com.sabia.auth.dto.response.AlunoDaTurmaResponse;
import com.sabia.auth.dto.response.SenhaAlunoResponse;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.service.ProfessorAlunoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/professor/turmas/{turmaId}/alunos")
@RequiredArgsConstructor
@Tag(name = "Professor — Alunos da turma", description = "Dados de conta dos alunos das turmas do professor")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorAlunoController {

    private final ProfessorAlunoService professorAlunoService;

    @GetMapping
    @Operation(summary = "Lista os alunos da turma com matrícula, avatar e troca de senha pendente")
    public ResponseEntity<List<AlunoDaTurmaResponse>> listar(Authentication authentication,
                                                             @PathVariable Long turmaId) {
        Usuario professor = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(professorAlunoService.listar(professor, turmaId));
    }

    @PostMapping("/{alunoId}/senha")
    @Operation(summary = "Redefine a senha de um aluno da turma (gerada pelo sistema ou digitada pelo professor)")
    public ResponseEntity<SenhaAlunoResponse> redefinirSenha(Authentication authentication,
                                                             @PathVariable Long turmaId,
                                                             @PathVariable Long alunoId,
                                                             @Valid @RequestBody RedefinirSenhaAlunoRequest request) {
        Usuario professor = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(professorAlunoService.redefinirSenha(professor, turmaId, alunoId, request));
    }
}
