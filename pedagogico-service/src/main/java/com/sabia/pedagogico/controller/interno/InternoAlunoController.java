package com.sabia.pedagogico.controller.interno;

import com.sabia.pedagogico.dto.request.AtualizarNomeAlunoRequest;
import com.sabia.pedagogico.service.AlunoNomeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints serviço-a-serviço sobre alunos, chamados pelo auth-service com token de perfil
 * SISTEMA (edição do perfil). Bloqueados no API Gateway: nunca expostos ao front.
 */
@RestController
@RequestMapping("/api/interno/alunos")
@RequiredArgsConstructor
@Tag(name = "Interno — Alunos")
@SecurityRequirement(name = "bearerAuth")
public class InternoAlunoController {

    private final AlunoNomeService alunoNomeService;

    @PutMapping("/{alunoId}/nome")
    @Operation(summary = "Atualiza o nome copiado do aluno em matrículas e submissões (uso interno, idempotente)")
    public ResponseEntity<Void> atualizarNome(@PathVariable Long alunoId,
                                              @Valid @RequestBody AtualizarNomeAlunoRequest request) {
        alunoNomeService.atualizarNome(alunoId, request.nome());
        return ResponseEntity.noContent().build();
    }
}
