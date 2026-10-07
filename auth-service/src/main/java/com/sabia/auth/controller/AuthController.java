package com.sabia.auth.controller;

import com.sabia.auth.dto.request.BuscarAlunoRequest;
import com.sabia.auth.dto.request.EsqueciSenhaRequest;
import com.sabia.auth.dto.request.LoginRequest;
import com.sabia.auth.dto.request.PerfilRequest;
import com.sabia.auth.dto.request.RedefinirSenhaRequest;
import com.sabia.auth.dto.request.TrocarSenhaRequest;
import com.sabia.auth.dto.request.ValidateRequest;
import com.sabia.auth.dto.response.AlunoBuscaResponse;
import com.sabia.auth.dto.response.LoginResponse;
import com.sabia.auth.dto.response.MensagemResponse;
import com.sabia.auth.dto.response.MeResponse;
import com.sabia.auth.dto.response.PerfilStatusResponse;
import com.sabia.auth.dto.response.ValidateResponse;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.service.AlunoService;
import com.sabia.auth.service.AuthService;
import com.sabia.auth.service.PerfilService;
import com.sabia.auth.service.RecuperacaoSenhaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login, sessão e verificação de token")
public class AuthController {

    private final AuthService authService;
    private final RecuperacaoSenhaService recuperacaoSenhaService;
    private final PerfilService perfilService;
    private final AlunoService alunoService;

    @PostMapping("/login")
    @Operation(summary = "Autentica o usuário e retorna um token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Retorna o usuário autenticado a partir do token")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(new MeResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTipoPerfil().name()
        ));
    }

    @PostMapping("/validate")
    @Operation(summary = "Verifica assinatura e validade de um token JWT (uso do API Gateway)")
    public ResponseEntity<ValidateResponse> validate(@Valid @RequestBody ValidateRequest request) {
        return ResponseEntity.ok(authService.validar(request.token()));
    }

    @PostMapping("/esqueci-senha")
    @Operation(summary = "Envia um link de recuperação de senha por e-mail, se o e-mail existir")
    public ResponseEntity<MensagemResponse> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest request) {
        return ResponseEntity.ok(new MensagemResponse(recuperacaoSenhaService.esqueciSenha(request.email())));
    }

    @PostMapping("/redefinir-senha")
    @Operation(summary = "Redefine a senha a partir de um token de recuperação válido")
    public ResponseEntity<MensagemResponse> redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest request) {
        recuperacaoSenhaService.redefinirSenha(request.token(), request.novaSenha(), request.confirmarSenha());
        return ResponseEntity.ok(new MensagemResponse("Senha redefinida com sucesso."));
    }

    @PostMapping("/trocar-senha")
    @Operation(summary = "Troca a senha do usuário autenticado (uso obrigatório quando mustChangePassword=true)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<MensagemResponse> trocarSenha(Authentication authentication,
                                                          @Valid @RequestBody TrocarSenhaRequest request) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        authService.trocarSenha(usuario, request);
        return ResponseEntity.ok(new MensagemResponse("Senha alterada com sucesso."));
    }

    @PutMapping("/perfil")
    @Operation(summary = "Completa o perfil do aluno (nome, CPF, matrícula e avatar)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<MensagemResponse> atualizarPerfil(Authentication authentication,
                                                              @Valid @RequestBody PerfilRequest request) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        perfilService.completarPerfil(usuario, request);
        return ResponseEntity.ok(new MensagemResponse("Perfil atualizado com sucesso."));
    }

    @GetMapping("/perfil/status")
    @Operation(summary = "Indica se o aluno autenticado já completou o perfil")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<PerfilStatusResponse> statusPerfil(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(perfilService.status(usuario));
    }

    @GetMapping("/alunos/busca")
    @Operation(summary = "Busca um aluno por e-mail, CPF ou matrícula (uso exclusivo de professores)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AlunoBuscaResponse> buscarAluno(Authentication authentication,
                                                          @Valid BuscarAlunoRequest request) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(alunoService.buscar(usuario, request.termo()));
    }
}
