package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.CriarLicaoRequest;
import com.sabia.pedagogico.dto.request.SalvarLicaoRequest;
import com.sabia.pedagogico.dto.request.VincularTurmasRequest;
import com.sabia.pedagogico.dto.response.LicaoProfessorDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoProfessorResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoProfessorResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.ProfessorLicaoService;
import com.sabia.pedagogico.service.licao.ProgressoLicaoProfessorService;
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
@RequestMapping("/api/professor/licoes")
@RequiredArgsConstructor
@Tag(name = "Professor — Lições")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorLicaoController {

    private final ProfessorLicaoService licaoService;
    private final ProgressoLicaoProfessorService progressoService;

    @GetMapping
    @Operation(summary = "Lista as lições do professor (sem as arquivadas), da mais recente à mais antiga")
    public ResponseEntity<List<LicaoProfessorResumoResponse>> listar(
            Authentication auth, @RequestParam(required = false) Long turmaId) {
        return ResponseEntity.ok(licaoService.listar(professorId(auth), turmaId));
    }

    @PostMapping
    @Operation(summary = "Cria uma lição em rascunho")
    public ResponseEntity<LicaoProfessorDetalheResponse> criar(
            Authentication auth, @Valid @RequestBody CriarLicaoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(licaoService.criar(professorId(auth), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da lição com as páginas (inclui o gabarito dos questionários)")
    public ResponseEntity<LicaoProfessorDetalheResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.buscar(professorId(auth), id));
    }

    @GetMapping("/{id}/progresso")
    @Operation(summary = "Progresso dos alunos das turmas vinculadas, por turma e página a página (somente leitura)")
    public ResponseEntity<ProgressoLicaoProfessorResponse> progresso(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(progressoService.progresso(professorId(auth), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Salva metadados, prática e a lista ordenada de páginas")
    public ResponseEntity<LicaoProfessorDetalheResponse> salvar(
            Authentication auth, @PathVariable Long id, @Valid @RequestBody SalvarLicaoRequest request) {
        return ResponseEntity.ok(licaoService.salvar(professorId(auth), id, request));
    }

    @PutMapping("/{id}/turmas")
    @Operation(summary = "Substitui as turmas vinculadas à lição")
    public ResponseEntity<LicaoProfessorDetalheResponse> vincularTurmas(
            Authentication auth, @PathVariable Long id, @Valid @RequestBody VincularTurmasRequest request) {
        return ResponseEntity.ok(licaoService.vincularTurmas(professorId(auth), id, request));
    }

    @PostMapping("/{id}/publicar")
    @Operation(summary = "Publica a lição")
    public ResponseEntity<LicaoProfessorDetalheResponse> publicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.publicar(professorId(auth), id));
    }

    @PostMapping("/{id}/despublicar")
    @Operation(summary = "Volta a lição para rascunho, sem apagar nada")
    public ResponseEntity<LicaoProfessorDetalheResponse> despublicar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.despublicar(professorId(auth), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Arquiva a lição (sem exclusão física)")
    public ResponseEntity<Void> arquivar(Authentication auth, @PathVariable Long id) {
        licaoService.arquivar(professorId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
