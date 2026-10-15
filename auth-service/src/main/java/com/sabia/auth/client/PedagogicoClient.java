package com.sabia.auth.client;

import com.sabia.auth.exception.CodigoTurmaInvalidoException;
import com.sabia.auth.exception.PedagogicoIndisponivelException;
import com.sabia.auth.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Map;

/**
 * Cliente dos endpoints internos do Serviço Pedagógico ({@code /api/interno/**}), autenticado
 * com token de serviço (perfil SISTEMA, 60 s). 404 vira "código inválido"; qualquer outra
 * falha (conexão, timeout, 5xx, resposta inesperada) vira {@link PedagogicoIndisponivelException}.
 */
@Component
public class PedagogicoClient {

    private static final Duration TIMEOUT_CONEXAO = Duration.ofSeconds(2);
    private static final Duration TIMEOUT_LEITURA = Duration.ofSeconds(5);

    private final RestClient restClient;
    private final JwtTokenProvider jwtTokenProvider;

    public PedagogicoClient(@Value("${sabia.pedagogico.url}") String baseUrl, JwtTokenProvider jwtTokenProvider) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT_CONEXAO);
        requestFactory.setReadTimeout(TIMEOUT_LEITURA);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public record TurmaConvite(Long turmaId, String turmaNome) {}

    public TurmaConvite buscarTurmaPorCodigo(String codigo) {
        TurmaConvite turma;
        try {
            turma = restClient.get()
                    .uri("/api/interno/turmas/por-codigo/{codigo}", codigo)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .retrieve()
                    .body(TurmaConvite.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new CodigoTurmaInvalidoException();
        } catch (RestClientException e) {
            throw new PedagogicoIndisponivelException(e);
        }
        if (turma == null || turma.turmaId() == null) {
            throw new PedagogicoIndisponivelException(null);
        }
        return turma;
    }

    public void matricular(Long turmaId, Long alunoId, String alunoNome) {
        try {
            restClient.post()
                    .uri("/api/interno/turmas/{turmaId}/alunos", turmaId)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("alunoId", alunoId, "alunoNome", alunoNome))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound e) {
            // Turma excluída entre a busca e a matrícula.
            throw new CodigoTurmaInvalidoException();
        } catch (RestClientException e) {
            throw new PedagogicoIndisponivelException(e);
        }
    }

    private String bearer() {
        return "Bearer " + jwtTokenProvider.generateServiceToken();
    }
}
