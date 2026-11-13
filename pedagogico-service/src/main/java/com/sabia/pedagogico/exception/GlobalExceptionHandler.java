package com.sabia.pedagogico.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.fasterxml.jackson.annotation.JsonInclude;

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
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(ErroResponse.of(422, ex.getMessage()));
    }

    @ExceptionHandler(CenarioInvalidoException.class)
    public ResponseEntity<ErroResponse> handleCenarioInvalido(CenarioInvalidoException ex) {
        return ResponseEntity.badRequest()
                .body(ErroResponse.of(400, ex.getMessage()));
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResponse> handleConflito(ConflitoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErroResponse.of(409, ex.getMessage()));
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

    /** Corpo ilegível: a mensagem do parser pode trazer trechos do JSON (ex.: senha), então não é logada. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> handleCorpoIlegivel(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(ErroResponse.of(400, "Requisição inválida."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResponse> handleTipoInvalido(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(ErroResponse.of(400, "Requisição inválida."));
    }

    /** Erros de requisição do Spring MVC (rota, método, media type, parâmetro ausente): status do próprio Spring. */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class,
            HttpRequestMethodNotSupportedException.class, HttpMediaTypeNotSupportedException.class,
            HttpMediaTypeNotAcceptableException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErroResponse> handleErroDeRequisicao(Exception ex) {
        ErrorResponse erro = (ErrorResponse) ex;
        int codigo = erro.getStatusCode().value();
        String mensagem = switch (codigo) {
            case 404 -> "Recurso não encontrado.";
            case 405 -> "Método não permitido.";
            case 415 -> "Tipo de conteúdo não suportado.";
            default -> "Requisição inválida.";
        };
        return ResponseEntity.status(codigo).headers(erro.getHeaders()).body(ErroResponse.of(codigo, mensagem));
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
