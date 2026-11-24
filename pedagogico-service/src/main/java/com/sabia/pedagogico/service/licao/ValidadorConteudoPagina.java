package com.sabia.pedagogico.service.licao;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.licao.TipoPagina;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Valida o conteúdo de uma página da lição pelo tipo e devolve o JSON normalizado que é gravado em
 * pagina_licao.conteudo_json: só os campos conhecidos, o vídeo só com o id e o questionário com o
 * percentual mínimo preenchido. Os erros vão para o mapa com chaves "paginas[i].campo". O HTML não é
 * sanitizado aqui (só o tamanho é limitado): a sanitização é do front.
 */
@Component
@RequiredArgsConstructor
public class ValidadorConteudoPagina {

    static final int MAX_HTML_TEXTO = 20_000;
    static final int MAX_HTML_IMAGEM = 10_000;
    static final int MAX_URL = 500;
    static final int MAX_ALT = 200;
    static final int MAX_LEGENDA = 200;
    static final int MAX_TITULO_VIDEO = 255;
    public static final int DURACAO_MIN = 10;
    public static final int DURACAO_MAX = 10_800;
    static final int MIN_PERGUNTAS = 1;
    static final int MAX_PERGUNTAS = 10;
    static final int MAX_ENUNCIADO = 500;
    static final int MIN_ALTERNATIVAS = 2;
    static final int MAX_ALTERNATIVAS = 5;
    static final int MAX_ALTERNATIVA = 200;
    static final int PERCENTUAL_PADRAO = 70;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ConteudoTexto(String html) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ConteudoImagemTexto(String imagemUrl, String alt, String legenda, String html) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ConteudoVideoYoutube(String videoId, String titulo, String canal, Integer duracaoSegundos) {}

    public record ConteudoQuestionario(int percentualMinimo, List<Pergunta> perguntas) {}

    public record Pergunta(String enunciado, List<String> alternativas, int correta) {}

    private final ObjectMapper objectMapper;

    /**
     * @return o JSON normalizado, ou null se houve erro (registrado em {@code erros}).
     * @throws OperacaoInvalidaException para VIDEO_UPLOAD, que ainda não existe (422).
     */
    public String validar(int indice, TipoPagina tipo, JsonNode conteudo, Map<String, String> erros) {
        if (tipo == TipoPagina.VIDEO_UPLOAD) {
            throw new OperacaoInvalidaException("Upload de vídeo ainda não está disponível.");
        }
        Campos c = new Campos("paginas[" + indice + "].", erros);
        if (conteudo == null || !conteudo.isObject()) {
            c.erro("conteudo", "O conteúdo da página é obrigatório.");
            return null;
        }
        Object normalizado = switch (tipo) {
            case TEXTO -> texto(conteudo, c);
            case IMAGEM_TEXTO -> imagemTexto(conteudo, c);
            case VIDEO_YOUTUBE -> videoYoutube(conteudo, c);
            case QUESTIONARIO -> questionario(conteudo, c);
            case VIDEO_UPLOAD -> throw new IllegalStateException("tratado acima");
        };
        return c.ok ? objectMapper.writeValueAsString(normalizado) : null;
    }

    private ConteudoTexto texto(JsonNode no, Campos c) {
        String html = c.texto(no, "html", true, MAX_HTML_TEXTO, false);
        return new ConteudoTexto(html);
    }

    private ConteudoImagemTexto imagemTexto(JsonNode no, Campos c) {
        String url = c.texto(no, "imagemUrl", true, MAX_URL, true);
        if (url != null && !https(url)) {
            c.erro("imagemUrl", "Informe um endereço de imagem que comece com https://.");
        }
        String alt = c.texto(no, "alt", true, MAX_ALT, true);
        String legenda = c.texto(no, "legenda", false, MAX_LEGENDA, true);
        String html = c.texto(no, "html", false, MAX_HTML_IMAGEM, false);
        return new ConteudoImagemTexto(url, alt, legenda, html);
    }

    private ConteudoVideoYoutube videoYoutube(JsonNode no, Campos c) {
        String entrada = c.texto(no, "videoId", true, MAX_URL, true);
        String id = null;
        if (entrada != null) {
            id = YoutubeUrl.extrairId(entrada).orElse(null);
            if (id == null) c.erro("videoId", "Informe um link do YouTube válido (https) ou o id do vídeo.");
        }
        String titulo = c.texto(no, "titulo", false, MAX_TITULO_VIDEO, true);
        String canal = c.texto(no, "canal", false, MAX_TITULO_VIDEO, true);
        Integer duracao = c.inteiro(no, "duracaoSegundos", false, DURACAO_MIN, DURACAO_MAX,
                "A duração deve ficar entre " + DURACAO_MIN + " e " + DURACAO_MAX + " segundos.");
        return new ConteudoVideoYoutube(id, titulo, canal, duracao);
    }

    private ConteudoQuestionario questionario(JsonNode no, Campos c) {
        Integer percentual = c.inteiro(no, "percentualMinimo", false, 0, 100,
                "O percentual mínimo deve ficar entre 0 e 100.");
        List<Pergunta> perguntas = new ArrayList<>();
        JsonNode lista = no.get("perguntas");
        if (lista == null || !lista.isArray() || lista.size() < MIN_PERGUNTAS || lista.size() > MAX_PERGUNTAS) {
            c.erro("perguntas", "O questionário deve ter de " + MIN_PERGUNTAS + " a " + MAX_PERGUNTAS + " perguntas.");
        } else {
            for (int i = 0; i < lista.size(); i++) {
                perguntas.add(pergunta(lista.get(i), c.filho("perguntas[" + i + "].")));
            }
        }
        return new ConteudoQuestionario(percentual != null ? percentual : PERCENTUAL_PADRAO, perguntas);
    }

    private Pergunta pergunta(JsonNode no, Campos c) {
        if (no == null || !no.isObject()) {
            c.erro("enunciado", "A pergunta é obrigatória.");
            return null;
        }
        String enunciado = c.texto(no, "enunciado", true, MAX_ENUNCIADO, true);
        List<String> alternativas = new ArrayList<>();
        JsonNode lista = no.get("alternativas");
        if (lista == null || !lista.isArray() || lista.size() < MIN_ALTERNATIVAS || lista.size() > MAX_ALTERNATIVAS) {
            c.erro("alternativas", "Cada pergunta deve ter de " + MIN_ALTERNATIVAS + " a " + MAX_ALTERNATIVAS
                    + " alternativas.");
        } else {
            for (int i = 0; i < lista.size(); i++) {
                JsonNode alt = lista.get(i);
                String chave = "alternativas[" + i + "]";
                if (alt == null || !alt.isString() || alt.stringValue().isBlank()) {
                    c.erro(chave, "A alternativa não pode ficar vazia.");
                } else if (alt.stringValue().trim().length() > MAX_ALTERNATIVA) {
                    c.erro(chave, "A alternativa deve ter no máximo " + MAX_ALTERNATIVA + " caracteres.");
                } else {
                    alternativas.add(alt.stringValue().trim());
                }
            }
        }
        int limite = lista != null && lista.isArray() ? lista.size() - 1 : -1;
        Integer correta = c.inteiro(no, "correta", true, 0, Math.max(limite, 0),
                "Indique a alternativa correta entre as alternativas da pergunta.");
        return new Pergunta(enunciado, alternativas, correta != null ? correta : -1);
    }

    private static boolean https(String url) {
        if (url.chars().anyMatch(Character::isWhitespace)) return false;
        try {
            URI uri = new URI(url);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }

    /** Lê campos de um nó e acumula os erros com o prefixo da página (e da pergunta). */
    private static final class Campos {
        private final String prefixo;
        private final Map<String, String> erros;
        private final Campos raiz;
        boolean ok = true;

        Campos(String prefixo, Map<String, String> erros) {
            this(prefixo, erros, null);
        }

        private Campos(String prefixo, Map<String, String> erros, Campos raiz) {
            this.prefixo = prefixo;
            this.erros = erros;
            this.raiz = raiz;
        }

        Campos filho(String sufixo) {
            return new Campos(prefixo + sufixo, erros, raiz != null ? raiz : this);
        }

        void erro(String campo, String mensagem) {
            erros.putIfAbsent(prefixo + campo, mensagem);
            ok = false;
            if (raiz != null) raiz.ok = false;
        }

        String texto(JsonNode no, String campo, boolean obrigatorio, int maximo, boolean aparar) {
            JsonNode valor = no.get(campo);
            if (valor == null || valor.isNull()) {
                if (obrigatorio) erro(campo, "Campo obrigatório.");
                return null;
            }
            if (!valor.isString()) {
                erro(campo, "Deve ser um texto.");
                return null;
            }
            String texto = aparar ? valor.stringValue().trim() : valor.stringValue();
            if (texto.isBlank()) {
                if (obrigatorio) erro(campo, "Campo obrigatório.");
                return null;
            }
            if (texto.length() > maximo) {
                erro(campo, "Deve ter no máximo " + maximo + " caracteres.");
                return null;
            }
            return texto;
        }

        Integer inteiro(JsonNode no, String campo, boolean obrigatorio, int minimo, int maximo, String mensagem) {
            JsonNode valor = no.get(campo);
            if (valor == null || valor.isNull()) {
                if (obrigatorio) erro(campo, "Campo obrigatório.");
                return null;
            }
            if (!valor.isIntegralNumber() || !valor.canConvertToInt()
                    || valor.intValue() < minimo || valor.intValue() > maximo) {
                erro(campo, mensagem);
                return null;
            }
            return valor.intValue();
        }
    }
}
