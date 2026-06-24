package com.sabia.api.controller.aluno;

import com.sabia.api.dto.response.SubmissaoAvaliativaResponse;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.SubmissaoAvaliativaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aluno/submissoes")
@RequiredArgsConstructor
@Tag(name = "Aluno — Submissões")
@SecurityRequirement(name = "bearerAuth")
public class AlunoSubmissaoController {

    private final SubmissaoAvaliativaService submissaoAvaliativaService;

    @GetMapping
    @Operation(summary = "Lista submissões do aluno com status")
    public ResponseEntity<List<SubmissaoAvaliativaResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(submissaoAvaliativaService.listarDoAluno(alunoId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da submissão com avaliação (quando CORRIGIDA)")
    public ResponseEntity<SubmissaoAvaliativaResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(submissaoAvaliativaService.buscarDoAluno(alunoId(auth), id));
    }

    private Long alunoId(Authentication auth) {
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
