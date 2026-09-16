package com.sabia.pedagogico.controller.ia;

import com.sabia.pedagogico.dto.request.GerarAtividadeRequest;
import com.sabia.pedagogico.dto.response.SugestaoAtividadeResponse;
import com.sabia.pedagogico.service.IaAtividadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
@Tag(name = "IA — Geração de Atividades")
@SecurityRequirement(name = "bearerAuth")
public class IaController {

    private final IaAtividadeService iaAtividadeService;

    @PostMapping("/gerar-atividade")
    @Operation(summary = "Gera sugestão de título e descrição para uma atividade via IA")
    public ResponseEntity<SugestaoAtividadeResponse> gerarAtividade(
            @Valid @RequestBody GerarAtividadeRequest request) {
        return ResponseEntity.ok(iaAtividadeService.gerarSugestao(request));
    }
}
