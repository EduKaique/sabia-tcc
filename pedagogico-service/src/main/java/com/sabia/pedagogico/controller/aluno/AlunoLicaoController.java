package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.request.ConcluirAtividadeRequest;
import com.sabia.pedagogico.dto.request.EstadoLicaoRequest;
import com.sabia.pedagogico.dto.request.RespostasQuestionarioRequest;
import com.sabia.pedagogico.dto.response.ConclusaoAtividadeResponse;
import com.sabia.pedagogico.dto.response.CorrecaoQuestionarioResponse;
import com.sabia.pedagogico.dto.response.LicaoDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.ProgressoLicaoResponse;
import com.sabia.pedagogico.dto.response.PulsoVideoResponse;
import com.sabia.pedagogico.dto.response.VistaPaginaResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.LicaoService;
import com.sabia.pedagogico.service.ProgressoPaginaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aluno/licoes")
@RequiredArgsConstructor
@Tag(name = "Aluno — Lições")
@SecurityRequirement(name = "bearerAuth")
public class AlunoLicaoController {

    private final LicaoService licaoService;
    private final ProgressoPaginaService progressoPaginaService;

    @GetMapping
    @Operation(summary = "Lista as lições publicadas nas turmas do aluno, com o progresso dele")
    public ResponseEntity<List<LicaoResumoResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(licaoService.listarParaAluno(alunoId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe da lição com páginas (sem gabarito), progresso e último estado do workspace")
    public ResponseEntity<LicaoDetalheResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(licaoService.buscarParaAluno(alunoId(auth), id));
    }

    @PostMapping("/{id}/paginas/{paginaId}/vista")
    @Operation(summary = "Registra que o aluno abriu a página (idempotente)")
    public ResponseEntity<VistaPaginaResponse> marcarVista(
            Authentication auth, @PathVariable Long id, @PathVariable Long paginaId) {
        return ResponseEntity.ok(progressoPaginaService.marcarVista(alunoId(auth), id, paginaId));
    }

    @PostMapping("/{id}/paginas/{paginaId}/video/pulso")
    @Operation(summary = "Pulso do player enquanto o vídeo toca; o crédito é medido pelo relógio do servidor")
    public ResponseEntity<PulsoVideoResponse> registrarPulso(
            Authentication auth, @PathVariable Long id, @PathVariable Long paginaId) {
        return ResponseEntity.ok(progressoPaginaService.registrarPulso(alunoId(auth), id, paginaId));
    }

    @PostMapping("/{id}/paginas/{paginaId}/questionario")
    @Operation(summary = "Corrige uma tentativa do questionário (diz se cada pergunta está certa, sem o gabarito)")
    public ResponseEntity<CorrecaoQuestionarioResponse> corrigirQuestionario(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long paginaId,
            @Valid @RequestBody RespostasQuestionarioRequest request) {
        return ResponseEntity.ok(progressoPaginaService.corrigirQuestionario(alunoId(auth), id, paginaId,
                request.respostas()));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Salva o estado do workspace (autosave)")
    public ResponseEntity<ProgressoLicaoResponse> salvarEstado(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody EstadoLicaoRequest request) {
        return ResponseEntity.ok(licaoService.salvarEstado(alunoId(auth), id, request.estadoJson()));
    }

    @PostMapping("/{id}/concluir-atividade")
    @Operation(summary = "Valida o projeto no servidor e conclui a prática da lição se estiver correto")
    public ResponseEntity<ConclusaoAtividadeResponse> concluirAtividade(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody ConcluirAtividadeRequest request) {
        return ResponseEntity.ok(licaoService.concluirAtividade(alunoId(auth), id, request.estadoJson()));
    }

    private Long alunoId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
