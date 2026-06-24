package com.sabia.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.api.dto.request.GerarAtividadeRequest;
import com.sabia.api.dto.response.SugestaoAtividadeResponse;
import com.sabia.api.exception.IaIndisponivelException;
import com.sabia.api.exception.ResourceNotFoundException;
import com.sabia.api.model.turma.Turma;
import com.sabia.api.repository.TurmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IaAtividadeService {

    private final TurmaRepository turmaRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${sabia.ia.gemini.api-key}")
    private String geminiApiKey;

    @Value("${sabia.ia.gemini.model}")
    private String geminiModel;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(IaAtividadeService.class);

    public SugestaoAtividadeResponse gerarSugestao(GerarAtividadeRequest request) {

        Turma turma = turmaRepository.findById(request.idTurma())
                .orElseThrow(() -> new ResourceNotFoundException("Turma", request.idTurma()));

        String prompt = buildPrompt(turma, request);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "responseMimeType", "application/json"
                )
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<?, ?> response;
        try {
            response = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException e) {
            log.error("Erro ao chamar API do Gemini: {} - {}", 
                    e.getClass().getSimpleName(), e.getMessage(), e);
            throw new IaIndisponivelException("Serviço de IA temporariamente indisponível.");
        }
        String generatedText = extractText(response);

        try {
            Map<?, ?> parsed = objectMapper.readValue(generatedText, Map.class);
            String titulo = (String) parsed.get("titulo");
            String descricao = (String) parsed.get("descricao");
            String gabaritoEstadoJson = (String) parsed.get("gabarito_estado_json");
            return new SugestaoAtividadeResponse(titulo, descricao, gabaritoEstadoJson);
        } catch (JsonProcessingException e) {
            throw new IaIndisponivelException("Resposta da IA em formato inválido.");
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> response) {
        try {
            List<Map<?, ?>> candidates = (List<Map<?, ?>>) response.get("candidates");
            Map<?, ?> content = (Map<?, ?>) candidates.get(0).get("content");
            List<Map<?, ?>> parts = (List<Map<?, ?>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            throw new IaIndisponivelException("Resposta da IA em formato inválido.");
        }
    }

    private String buildPrompt(Turma turma, GerarAtividadeRequest request) {
        String etapaDisplay = switch (turma.getEtapa()) {
            case ANOS_INICIAIS -> "Anos Iniciais do Ensino Fundamental";
            case ANOS_FINAIS -> "Anos Finais do Ensino Fundamental";
            case MEDIO -> "Ensino Médio";
            case TECNICO -> "Ensino Técnico";
        };

        return """
                Você é um assistente pedagógico especializado em programação com Scratch para educação básica.

                Contexto da turma:
                - Tipo de atividade: %s
                - Etapa de ensino: %s

                O professor descreveu o seguinte objetivo pedagógico:
                "%s"

                Com base nesse objetivo, gere um título conciso, uma descrição clara e motivadora para essa atividade e o JSON dos blocos de gabarito da atividade.

                Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional:
                {"titulo": "...", "descricao": "...", "gabarito_estado_json": "..."}
                """.formatted(request.tipoAtividade(), etapaDisplay, request.descricaoObjetivo());
    }
}
