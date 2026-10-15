package com.sabia.pedagogico.controller.publico;

import com.sabia.pedagogico.dto.response.ConviteValidoResponse;
import com.sabia.pedagogico.service.TurmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/publico/convites")
@RequiredArgsConstructor
@Tag(name = "Público — Convites")
public class PublicoConviteController {

    private final TurmaService turmaService;

    @GetMapping("/{codigo}")
    @Operation(summary = "Valida um código de convite de turma (sem autenticação)")
    public ResponseEntity<ConviteValidoResponse> validar(@PathVariable String codigo) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(turmaService.validarCodigoConvite(codigo));
    }
}
