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
            Object gabaritoObj = parsed.get("gabarito_estado_json");
            String gabaritoEstadoJson = null;

            if (gabaritoObj != null) {
                Map<?, ?> gabaritoMap = (Map<?, ?>) gabaritoObj;
                if (gabaritoMap.containsKey("languageVersion")) {
                    gabaritoEstadoJson = objectMapper.writeValueAsString(Map.of("blocks", gabaritoObj));
                } else {
                    gabaritoEstadoJson = objectMapper.writeValueAsString(gabaritoObj);
                }
            }

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
        Você é um assistente pedagógico especializado em programação visual com Blockly para educação básica.

        Contexto da turma:
        - Tipo de atividade: %s
        - Etapa de ensino: %s

        O professor descreveu o seguinte objetivo pedagógico:
        "%s"

        Com base nesse objetivo, gere titulo, descricao e gabarito_estado_json.

        REGRAS para gabarito_estado_json:
        - Use APENAS estes tipos de bloco: controls_if, logic_compare, logic_operation, logic_negate, logic_boolean, math_number, math_arithmetic, math_modulo, text, text_print, text_join, get_input, variables_get, variables_set, controls_repeat_ext, controls_whileUntil, controls_for
        - NUNCA use controls_if com ELSE. Use dois controls_if separados com logic_negate.
        - Formato: objeto com chave "blocks" contendo "languageVersion": 0 e array "blocks".
        - Blocos topLevel precisam de "type", "id", "x", "y". Sequencia via "next", nao array.
        - Todos os textos: apenas ASCII sem acentos.
        - Use APENAS estes tipos de bloco: controls_if, logic_compare, logic_operation, logic_negate, logic_boolean, math_number, math_arithmetic, math_modulo, text, text_print, get_input, variables_get, variables_set, controls_repeat_ext, controls_whileUntil, controls_for
        - NUNCA use text_join. Para imprimir texto com variavel, use text_print duas vezes separadas.
        - NUNCA inclua o campo "mutation" em nenhum bloco.
        - Para usar variaveis, inclua no JSON raiz uma chave "variables" com array de objetos {"name": "nomevariavel", "id": "id_unico"}. Nos blocos variables_get e variables_set, use "fields": {"VAR": {"id": "id_unico"}}.
        - O bloco logic_negate usa a entrada "BOOL" (nao "VALUE"). Exemplo correto: "inputs":{"BOOL":{"block":{...}}}
        - Apenas blocos topLevel (sem pai) devem ter "x" e "y". Blocos dentro de "next" ou "inputs" nao devem ter "x" e "y".
        - O bloco text_print usa a entrada "TEXT" (nao "VALUE"). Exemplo: "inputs":{"TEXT":{"block":{...}}}
        - O bloco get_input NAO tem entradas (inputs). Ele apenas retorna o valor digitado pelo usuario.
        Use-o assim: {"type":"get_input","id":"id_unico"}  — sem nenhum campo "inputs" ou "fields".
        Para mostrar instrucoes ao usuario, use um text_print ANTES do get_input.
        REFERENCIA DE ENTRADAS (use exatamente estes nomes):
            - text_print:      "TEXT"
            - logic_negate:    "BOOL"
            - logic_compare:   "A", "B"
            - math_modulo:     "DIVIDEND", "DIVISOR"
            - math_arithmetic: "A", "B"
            - controls_if:     "IF0", "DO0"  (sem ELSE)
            - variables_set:   "VALUE"
            - controls_for:    "FROM", "TO", "BY", "DO"
            - controls_repeat_ext: "TIMES", "DO"
            - controls_whileUntil: "BOOL", "DO"

        Responda APENAS com este JSON (gabarito_estado_json e um objeto, nao uma string):
        {"titulo": "...", "descricao": "...", "gabarito_estado_json": {"blocks": {"languageVersion": 0, "blocks": [...]}}}
        """.formatted(request.tipoAtividade(), etapaDisplay, request.descricaoObjetivo());
    }
}
