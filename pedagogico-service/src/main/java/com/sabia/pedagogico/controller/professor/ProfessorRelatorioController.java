package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.RelatorioRequest;
import com.sabia.pedagogico.dto.response.DistribuicaoNotasResponse;
import com.sabia.pedagogico.dto.response.MediaAtividadeResponse;
import com.sabia.pedagogico.dto.response.ProgressaoTurmaResponse;
import com.sabia.pedagogico.dto.response.RelatorioProfessorResponse;
import com.sabia.pedagogico.dto.response.StatusEntregasResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.RelatorioProfessorService;
import com.sabia.pedagogico.service.RelatorioTurmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/professor/relatorio")
@RequiredArgsConstructor
@Tag(name = "Professor — Relatórios")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorRelatorioController {

    private final RelatorioProfessorService relatorioService;
    private final RelatorioTurmaService relatorioTurmaService;

    @GetMapping
    @Operation(summary = "Gera relatório consolidado do professor")
    public ResponseEntity<RelatorioProfessorResponse> gerar(
            Authentication auth,
            @ModelAttribute RelatorioRequest request) {
        return ResponseEntity.ok(relatorioService.gerar(professorId(auth), request));
    }

    @GetMapping("/turmas/{turmaId}/medias-atividades")
    @Operation(summary = "Média de notas, entregas e correções por atividade da turma")
    public ResponseEntity<List<MediaAtividadeResponse>> mediasAtividades(
            Authentication auth,
            @PathVariable Long turmaId,
            @RequestParam(required = false) Long atividadeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(relatorioTurmaService.mediasPorAtividade(professorId(auth), turmaId, atividadeId, dataInicio, dataFim));
    }

    @GetMapping("/turmas/{turmaId}/distribuicao-notas")
    @Operation(summary = "Histograma de notas (% da pontuação máxima), média e mediana da turma")
    public ResponseEntity<DistribuicaoNotasResponse> distribuicaoNotas(
            Authentication auth,
            @PathVariable Long turmaId,
            @RequestParam(required = false) Long atividadeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(relatorioTurmaService.distribuicaoNotas(professorId(auth), turmaId, atividadeId, dataInicio, dataFim));
    }

    @GetMapping("/turmas/{turmaId}/progressao-alunos")
    @Operation(summary = "Progressão das notas de cada aluno ao longo das atividades, com a média da turma")
    public ResponseEntity<ProgressaoTurmaResponse> progressaoAlunos(
            Authentication auth,
            @PathVariable Long turmaId,
            @RequestParam(required = false) Long atividadeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(relatorioTurmaService.progressaoAlunos(professorId(auth), turmaId, atividadeId, dataInicio, dataFim));
    }

    @GetMapping("/turmas/{turmaId}/status-entregas")
    @Operation(summary = "Situação das entregas da turma (não entregues, pendentes, corrigidas, atraso)")
    public ResponseEntity<StatusEntregasResponse> statusEntregas(
            Authentication auth,
            @PathVariable Long turmaId,
            @RequestParam(required = false) Long atividadeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(relatorioTurmaService.statusEntregas(professorId(auth), turmaId, atividadeId, dataInicio, dataFim));
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
