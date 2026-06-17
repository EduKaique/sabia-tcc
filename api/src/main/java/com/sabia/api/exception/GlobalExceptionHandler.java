package com.sabia.api.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
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

    @ExceptionHandler({AtividadeNaoEncontradaException.class, SubmissaoNaoEncontradaException.class,
            ResourceNotFoundException.class})
    public ResponseEntity<ErroResponse> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErroResponse.of(404, ex.getMessage()));
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ErroResponse> handleAcessoNegado(AcessoNegadoException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErroResponse.of(403, ex.getMessage()));
    }

    @ExceptionHandler(OperacaoInvalidaException.class)
    public ResponseEntity<ErroResponse> handleOperacaoInvalida(OperacaoInvalidaException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ErroResponse.of(422, ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErroResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErroResponse.of(401, ex.getMessage()));
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> handleGeneric(Exception ex) {
        log.error("Erro inesperado: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErroResponse.of(500, "Erro interno do servidor"));
    }

    public record ErroResponse(int status, String erro, String timestamp, Map<String, String> campos) {

        public static ErroResponse of(int status, String erro) {
            return new ErroResponse(status, erro, Instant.now().toString(), null);
        }

        public static ErroResponse ofValidation(Map<String, String> campos) {
            return new ErroResponse(400, "Dados inválidos", Instant.now().toString(), campos);
        }
    }
}
