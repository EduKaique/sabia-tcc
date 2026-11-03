package com.sabia.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);
        // Token de serviço (SISTEMA) não representa usuário: não autentica no auth-service.
        if (token != null && jwtTokenProvider.isTokenValid(token)
                && !jwtTokenProvider.isServiceToken(jwtTokenProvider.extractClaims(token))) {
            if (jwtTokenProvider.exigeTrocaDeSenha(jwtTokenProvider.extractClaims(token))
                    && !rotaLiberadaComTrocaPendente(request)) {
                recusarSenhaTemporaria(response);
                return;
            }
            Long userId = jwtTokenProvider.extractUserId(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());

            if (userDetails.isEnabled()) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }

    /** Com troca de senha pendente, só a própria troca e o "quem sou eu" ficam liberados. */
    private boolean rotaLiberadaComTrocaPendente(HttpServletRequest request) {
        String metodo = request.getMethod();
        String caminho = request.getRequestURI().substring(request.getContextPath().length());
        return ("POST".equals(metodo) && "/api/auth/trocar-senha".equals(caminho))
                || ("GET".equals(metodo) && "/api/auth/me".equals(caminho));
    }

    private void recusarSenhaTemporaria(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"erro\":\"Você precisa trocar sua senha para continuar.\","
                + "\"codigo\":\"SENHA_TEMPORARIA\",\"timestamp\":\"" + Instant.now() + "\"}");
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
