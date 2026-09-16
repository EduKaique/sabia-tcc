package com.sabia.auth.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ErroResponse> handleBadCredentials(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErroResponse.of(401, "E-mail ou senha incorretos"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            campos.put(field, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(ErroResponse.ofValidation(campos));
    }

    @ExceptionHandler(SenhaDivergenteException.class)
    public ResponseEntity<ErroResponse> handleSenhaDivergente(SenhaDivergenteException ex) {
        return ResponseEntity.status(422).body(ErroResponse.of(422, ex.getMessage()));
    }

    @ExceptionHandler(TokenRecuperacaoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleTokenRecuperacaoInvalido(TokenRecuperacaoInvalidoException ex) {
        return ResponseEntity.status(422).body(ErroResponse.of(422, ex.getMessage()));
    }

    @ExceptionHandler({TokenRecuperacaoExpiradoException.class, TokenRecuperacaoUtilizadoException.class})
    public ResponseEntity<ErroResponse> handleTokenRecuperacaoExpiradoOuUtilizado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.GONE).body(ErroResponse.of(410, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> handleGeneric(Exception ex) {
        log.error("Erro inesperado: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErroResponse.of(500, "Erro interno do servidor"));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErroResponse(int status, String erro, String timestamp, Map<String, String> campos) {

        public static ErroResponse of(int status, String erro) {
            return new ErroResponse(status, erro, Instant.now().toString(), null);
        }

        public static ErroResponse ofValidation(Map<String, String> campos) {
            return new ErroResponse(400, "Dados inválidos", Instant.now().toString(), campos);
        }
    }
}
