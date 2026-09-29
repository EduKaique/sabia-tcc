package com.sabia.auth.controller;

import com.sabia.auth.dto.request.CriarProfessorRequest;
import com.sabia.auth.dto.response.MensagemResponse;
import com.sabia.auth.dto.response.ProfessorResponse;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.service.AdminProfessorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/professores")
@RequiredArgsConstructor
@Tag(name = "Admin — Professores", description = "Gestão de contas de professor (exclusivo ADMINISTRADOR)")
@SecurityRequirement(name = "bearerAuth")
public class AdminProfessorController {

    private final AdminProfessorService adminProfessorService;

    @GetMapping
    @Operation(summary = "Lista professores, opcionalmente filtrando por status ativo/inativo")
    public ResponseEntity<List<ProfessorResponse>> listar(@RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(adminProfessorService.listar(ativo));
    }

    @PostMapping
    @Operation(summary = "Cadastra um professor com senha temporária (mustChangePassword=true)")
    public ResponseEntity<ProfessorResponse> criar(Authentication authentication,
                                                    @Valid @RequestBody CriarProfessorRequest request) {
        Usuario admin = (Usuario) authentication.getPrincipal();
        ProfessorResponse response = adminProfessorService.criar(admin, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/desativar")
    @Operation(summary = "Desativa o acesso do professor (soft delete — mantém turmas e atividades)")
    public ResponseEntity<MensagemResponse> desativar(@PathVariable Long id) {
        adminProfessorService.desativar(id);
        return ResponseEntity.ok(new MensagemResponse("Professor desativado com sucesso."));
    }

    @PatchMapping("/{id}/reativar")
    @Operation(summary = "Reativa o acesso do professor")
    public ResponseEntity<MensagemResponse> reativar(@PathVariable Long id) {
        adminProfessorService.reativar(id);
        return ResponseEntity.ok(new MensagemResponse("Professor reativado com sucesso."));
    }
}
