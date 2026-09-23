package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.request.SubmeterAtividadeRequest;
import com.sabia.pedagogico.dto.response.AtividadeAvaliativaAlunoResponse;
import com.sabia.pedagogico.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.AtividadeAvaliativaService;
import com.sabia.pedagogico.service.SubmissaoAvaliativaService;
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
@RequestMapping("/api/aluno/atividades")
@RequiredArgsConstructor
@Tag(name = "Aluno — Atividades")
@SecurityRequirement(name = "bearerAuth")
public class AlunoAtividadeController {

    private final AtividadeAvaliativaService atividadeAvaliativaService;
    private final SubmissaoAvaliativaService submissaoAvaliativaService;

    @GetMapping
    @Operation(summary = "Lista atividades publicadas das turmas do aluno")
    public ResponseEntity<List<AtividadeAvaliativaAlunoResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(atividadeAvaliativaService.listarPublicadasParaAluno(alunoId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe de uma atividade disponível")
    public ResponseEntity<AtividadeAvaliativaAlunoResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(atividadeAvaliativaService.buscarParaAluno(alunoId(auth), id));
    }

    @PostMapping("/{id}/submeter")
    @Operation(summary = "Submete a atividade com o estado JSON do projeto Scratch")
    public ResponseEntity<SubmissaoAvaliativaResponse> submeter(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody SubmeterAtividadeRequest request) {
        AuthenticatedUser aluno = (AuthenticatedUser) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submissaoAvaliativaService.submeter(aluno.id(), aluno.nome(), id, request));
    }

    private Long alunoId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
