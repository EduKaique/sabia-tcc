package com.sabia.api.controller.professor;

import com.sabia.api.dto.response.TurmaResponse;
import com.sabia.api.model.usuario.Usuario;
import com.sabia.api.service.TurmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        Long professorId = ((Usuario) auth.getPrincipal()).getId();
        return ResponseEntity.ok(turmaService.listarDoProfessor(professorId));
    }
}
