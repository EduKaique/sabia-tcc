package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.request.AtualizarProjetoSandboxRequest;
import com.sabia.pedagogico.dto.request.CriarProjetoSandboxRequest;
import com.sabia.pedagogico.dto.response.ProjetoSandboxDetalheResponse;
import com.sabia.pedagogico.dto.response.ProjetoSandboxResumoResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.ProjetoSandboxService;
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
@RequestMapping("/api/aluno")
@RequiredArgsConstructor
@Tag(name = "Aluno — Sandbox (Meus Projetos)")
@SecurityRequirement(name = "bearerAuth")
public class AlunoProjetoSandboxController {

    private final ProjetoSandboxService projetoSandboxService;

    @GetMapping("/projetos")
    @Operation(summary = "Lista os projetos do Sandbox do aluno (mais recentes primeiro)")
    public ResponseEntity<List<ProjetoSandboxResumoResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(projetoSandboxService.listar(alunoId(auth)));
    }

    @GetMapping("/projetos/{id}")
    @Operation(summary = "Detalhe de um projeto do Sandbox, com o estado do Blockly (404 se não for do aluno)")
    public ResponseEntity<ProjetoSandboxDetalheResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(projetoSandboxService.buscar(alunoId(auth), id));
    }

    @PostMapping("/projetos")
    @Operation(summary = "Cria um projeto do Sandbox (limite de 10 por aluno)")
    public ResponseEntity<ProjetoSandboxDetalheResponse> criar(
            Authentication auth, @Valid @RequestBody CriarProjetoSandboxRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projetoSandboxService.criar(alunoId(auth), request));
    }

    @PutMapping("/projetos/{id}")
    @Operation(summary = "Atualiza o nome e/ou o estado do projeto (limite de 1 MB)")
    public ResponseEntity<ProjetoSandboxDetalheResponse> atualizar(
            Authentication auth, @PathVariable Long id, @Valid @RequestBody AtualizarProjetoSandboxRequest request) {
        return ResponseEntity.ok(projetoSandboxService.atualizar(alunoId(auth), id, request));
    }

    @DeleteMapping("/projetos/{id}")
    @Operation(summary = "Exclui um projeto do Sandbox")
    public ResponseEntity<Void> excluir(Authentication auth, @PathVariable Long id) {
        projetoSandboxService.excluir(alunoId(auth), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/atividades/{atividadeId}/sandbox")
    @Operation(summary = "Continuar no Sandbox: copia o projeto entregue de uma atividade corrigida para Meus Projetos")
    public ResponseEntity<ProjetoSandboxDetalheResponse> continuarNoSandbox(
            Authentication auth, @PathVariable Long atividadeId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetoSandboxService.copiarDaAtividade(alunoId(auth), atividadeId));
    }

    private Long alunoId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
