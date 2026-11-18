package com.sabia.pedagogico.controller.professor;

import com.sabia.pedagogico.dto.request.CenarioRoboRequest;
import com.sabia.pedagogico.dto.response.CenarioRoboResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.CenarioRoboService;
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
@RequestMapping("/api/professor/cenarios")
@RequiredArgsConstructor
@Tag(name = "Professor — Cenários do robô")
@SecurityRequirement(name = "bearerAuth")
public class ProfessorCenarioController {

    private final CenarioRoboService cenarioRoboService;

    @GetMapping
    @Operation(summary = "Lista os cenários do professor autenticado, do mais recente ao mais antigo")
    public ResponseEntity<List<CenarioRoboResponse>> listar(Authentication auth) {
        return ResponseEntity.ok(cenarioRoboService.listarDoProfessor(professorId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha um cenário do professor")
    public ResponseEntity<CenarioRoboResponse> buscar(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(cenarioRoboService.buscar(professorId(auth), id));
    }

    @PostMapping
    @Operation(summary = "Salva um cenário (validado, inclusive se há caminho do início ao destino)")
    public ResponseEntity<CenarioRoboResponse> criar(Authentication auth,
                                                     @Valid @RequestBody CenarioRoboRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cenarioRoboService.criar(professorId(auth), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita um cenário; atividades que já o usam não mudam")
    public ResponseEntity<CenarioRoboResponse> atualizar(Authentication auth, @PathVariable Long id,
                                                         @Valid @RequestBody CenarioRoboRequest request) {
        return ResponseEntity.ok(cenarioRoboService.atualizar(professorId(auth), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui um cenário; atividades que já o usam não mudam")
    public ResponseEntity<Void> excluir(Authentication auth, @PathVariable Long id) {
        cenarioRoboService.excluir(professorId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private Long professorId(Authentication auth) {
        return ((AuthenticatedUser) auth.getPrincipal()).id();
    }
}
