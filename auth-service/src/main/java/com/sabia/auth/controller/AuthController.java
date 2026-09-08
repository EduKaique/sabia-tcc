package com.sabia.auth.controller;

import com.sabia.auth.dto.request.LoginRequest;
import com.sabia.auth.dto.request.ValidateRequest;
import com.sabia.auth.dto.response.LoginResponse;
import com.sabia.auth.dto.response.MeResponse;
import com.sabia.auth.dto.response.ValidateResponse;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login, sessão e verificação de token")
public class AuthController {

    private final AuthService authService;

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
}
