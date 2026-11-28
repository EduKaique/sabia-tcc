package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.licao.TipoPagina;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Validação do conteúdo das páginas por tipo, nos limites exatos e logo acima. */
class ValidadorConteudoPaginaTest {

    private final JsonMapper mapper = JsonMapper.builder().build();
    private final ValidadorConteudoPagina validador = new ValidadorConteudoPagina(mapper);
    private final Map<String, String> erros = new LinkedHashMap<>();

    private String validar(TipoPagina tipo, JsonNode conteudo) {
        return validador.validar(0, tipo, conteudo, erros);
    }

    private ObjectNode obj() {
        return mapper.createObjectNode();
    }

    private JsonNode ler(String json) {
        return mapper.readTree(json);
    }

    // ---------- TEXTO ----------

    @Test
    void textoNoLimiteEhAceitoEAcimaNao() {
        assertThat(validar(TipoPagina.TEXTO, obj().put("html", "a".repeat(20_000)))).isNotNull();
        assertThat(erros).isEmpty();

        assertThat(validar(TipoPagina.TEXTO, obj().put("html", "a".repeat(20_001)))).isNull();
        assertThat(erros).containsKey("paginas[0].html");
    }

    @Test
    void textoSemHtmlOuComTipoErradoEhRecusado() {
        validar(TipoPagina.TEXTO, obj());
        assertThat(erros).containsKey("paginas[0].html");
        erros.clear();
        validar(TipoPagina.TEXTO, obj().put("html", 10));
        assertThat(erros).containsKey("paginas[0].html");
    }

    @Test
    void conteudoAusenteOuQueNaoEhObjetoEhRecusado() {
        validar(TipoPagina.TEXTO, null);
        assertThat(erros).containsKey("paginas[0].conteudo");
        erros.clear();
        validar(TipoPagina.TEXTO, ler("[1,2]"));
        assertThat(erros).containsKey("paginas[0].conteudo");
    }

    @Test
    void indiceDaPaginaEntraNaChave() {
        validador.validar(3, TipoPagina.TEXTO, obj(), erros);
        assertThat(erros).containsOnlyKeys("paginas[3].html");
    }

    @Test
    void camposDesconhecidosNaoSaoGravados() {
        String json = validar(TipoPagina.TEXTO, obj().put("html", "<p>oi</p>").put("extra", "x"));
        assertThat(ler(json).has("extra")).isFalse();
        assertThat(ler(json).get("html").stringValue()).isEqualTo("<p>oi</p>");
    }

    // ---------- IMAGEM_TEXTO ----------

    private ObjectNode imagem() {
        return obj().put("imagemUrl", "https://exemplo.org/a.png").put("alt", "Um robô").put("legenda", "Figura 1")
                .put("html", "<p>texto</p>");
    }

    @Test
    void imagemValidaEhAceita() {
        String json = validar(TipoPagina.IMAGEM_TEXTO, imagem());
        assertThat(erros).isEmpty();
        assertThat(ler(json).get("alt").stringValue()).isEqualTo("Um robô");
    }

    @Test
    void imagemSemAltOuComAltLongoEhRecusada() {
        ObjectNode semAlt = imagem();
        semAlt.remove("alt");
        validar(TipoPagina.IMAGEM_TEXTO, semAlt);
        assertThat(erros).containsKey("paginas[0].alt");

        erros.clear();
        assertThat(validar(TipoPagina.IMAGEM_TEXTO, imagem().put("alt", "a".repeat(200)))).isNotNull();
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("alt", "a".repeat(201)));
        assertThat(erros).containsKey("paginas[0].alt");
    }

    @Test
    void imagemAceitaDataUriRasterEmLimiteProprio() {
        String png = "data:image/png;base64,iVBORw0KGgo=";
        assertThat(validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", png))).contains(png);
        String grande = "data:image/png;base64," + "A".repeat(20_000 - 22);
        assertThat(validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", grande))).isNotNull();
    }

    @Test
    void imagemRecusaDataUriInvalido() {
        for (String ruim : new String[] {
                "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", "data:text/html;base64,PGI+PC9iPg==",
                "data:image/png,abc", "data:image/png;base64,AA AA", "data:image/png;base64,",
                "data:image/png;base64," + "A".repeat(20_000)}) {
            validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", ruim));
            assertThat(erros).as(ruim.substring(0, Math.min(40, ruim.length()))).containsKey("paginas[0].imagemUrl");
            erros.clear();
        }
    }

    @Test
    void imagemExigeHttpsEUrlAte500() {
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", "http://exemplo.org/a.png"));
        assertThat(erros).containsKey("paginas[0].imagemUrl");
        erros.clear();
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", "javascript:alert(1)"));
        assertThat(erros).containsKey("paginas[0].imagemUrl");
        erros.clear();
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", "https://exemplo .org/a.png"));
        assertThat(erros).containsKey("paginas[0].imagemUrl");
        erros.clear();

        String base = "https://exemplo.org/";
        assertThat(validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", base + "a".repeat(500 - base.length()))))
                .isNotNull();
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("imagemUrl", base + "a".repeat(501 - base.length())));
        assertThat(erros).containsKey("paginas[0].imagemUrl");
    }

    @Test
    void imagemLegendaEHtmlNosLimites() {
        assertThat(validar(TipoPagina.IMAGEM_TEXTO, imagem().put("legenda", "a".repeat(200)).put("html", "a".repeat(10_000))))
                .isNotNull();
        validar(TipoPagina.IMAGEM_TEXTO, imagem().put("legenda", "a".repeat(201)).put("html", "a".repeat(10_001)));
        assertThat(erros).containsKeys("paginas[0].legenda", "paginas[0].html");
    }

    @Test
    void imagemSemLegendaEHtmlEhAceita() {
        String json = validar(TipoPagina.IMAGEM_TEXTO, obj().put("imagemUrl", "https://exemplo.org/a.png").put("alt", "x"));
        assertThat(erros).isEmpty();
        assertThat(ler(json).has("legenda")).isFalse();
    }

    // ---------- VIDEO_YOUTUBE ----------

    @Test
    void videoPorUrlGravaSoOId() {
        String json = validar(TipoPagina.VIDEO_YOUTUBE,
                obj().put("videoId", "https://youtu.be/dQw4w9WgXcQ?si=x").put("titulo", "Algoritmos").put("duracaoSegundos", 312));
        assertThat(erros).isEmpty();
        JsonNode no = ler(json);
        assertThat(no.get("videoId").stringValue()).isEqualTo("dQw4w9WgXcQ");
        assertThat(no.get("duracaoSegundos").intValue()).isEqualTo(312);
    }

    @Test
    void videoComUrlInvalidaOuSemIdEhRecusado() {
        validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "https://vimeo.com/123"));
        assertThat(erros).containsKey("paginas[0].videoId");
        erros.clear();
        validar(TipoPagina.VIDEO_YOUTUBE, obj());
        assertThat(erros).containsKey("paginas[0].videoId");
    }

    @ParameterizedTest
    @ValueSource(ints = {10, 10_800})
    void duracaoNosLimitesEhAceita(int duracao) {
        assertThat(validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ").put("duracaoSegundos", duracao)))
                .isNotNull();
        assertThat(erros).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(ints = {9, 10_801, 0, -5})
    void duracaoForaDosLimitesEhRecusada(int duracao) {
        validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ").put("duracaoSegundos", duracao));
        assertThat(erros).containsKey("paginas[0].duracaoSegundos");
    }

    @Test
    void duracaoDecimalOuTextoEhRecusada_eAusenteFicaParaOPublicar() {
        validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ").put("duracaoSegundos", 30.5));
        assertThat(erros).containsKey("paginas[0].duracaoSegundos");
        erros.clear();
        validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ").put("duracaoSegundos", "30"));
        assertThat(erros).containsKey("paginas[0].duracaoSegundos");
        erros.clear();

        String json = validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ"));
        assertThat(erros).isEmpty();
        assertThat(ler(json).has("duracaoSegundos")).isFalse();
    }

    @Test
    void videoTituloECanalAte255() {
        assertThat(validar(TipoPagina.VIDEO_YOUTUBE,
                obj().put("videoId", "dQw4w9WgXcQ").put("titulo", "a".repeat(255)).put("canal", "c".repeat(255)))).isNotNull();
        validar(TipoPagina.VIDEO_YOUTUBE, obj().put("videoId", "dQw4w9WgXcQ").put("titulo", "a".repeat(256)).put("canal", "c".repeat(256)));
        assertThat(erros).containsKeys("paginas[0].titulo", "paginas[0].canal");
    }

    @Test
    void videoUploadResponde422() {
        assertThatThrownBy(() -> validar(TipoPagina.VIDEO_UPLOAD, obj().put("midiaId", "x")))
                .isInstanceOf(OperacaoInvalidaException.class)
                .hasMessage("Upload de vídeo ainda não está disponível.");
    }

    // ---------- QUESTIONARIO ----------

    private ObjectNode pergunta(int alternativas, Integer correta) {
        ObjectNode p = obj().put("enunciado", "Qual?");
        ArrayNode alts = p.putArray("alternativas");
        for (int i = 0; i < alternativas; i++) alts.add("Alternativa " + i);
        if (correta != null) p.put("correta", correta);
        return p;
    }

    private ObjectNode questionario(int perguntas) {
        ObjectNode q = obj();
        ArrayNode lista = q.putArray("perguntas");
        for (int i = 0; i < perguntas; i++) lista.add(pergunta(3, 1));
        return q;
    }

    @Test
    void questionarioSemPercentualUsa70EGuardaOGabarito() {
        String json = validar(TipoPagina.QUESTIONARIO, questionario(1));
        assertThat(erros).isEmpty();
        JsonNode no = ler(json);
        assertThat(no.get("percentualMinimo").intValue()).isEqualTo(70);
        assertThat(no.get("perguntas").get(0).get("correta").intValue()).isEqualTo(1);
        assertThat(no.get("perguntas").get(0).get("alternativas")).hasSize(3);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 100})
    void percentualNosLimitesEhAceito(int percentual) {
        assertThat(validar(TipoPagina.QUESTIONARIO, questionario(1).put("percentualMinimo", percentual))).isNotNull();
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, 101})
    void percentualForaDaFaixaEhRecusado(int percentual) {
        validar(TipoPagina.QUESTIONARIO, questionario(1).put("percentualMinimo", percentual));
        assertThat(erros).containsKey("paginas[0].percentualMinimo");
    }

    @Test
    void quantidadeDePerguntasDe1A10() {
        assertThat(validar(TipoPagina.QUESTIONARIO, questionario(10))).isNotNull();
        validar(TipoPagina.QUESTIONARIO, questionario(11));
        assertThat(erros).containsKey("paginas[0].perguntas");
        erros.clear();
        validar(TipoPagina.QUESTIONARIO, questionario(0));
        assertThat(erros).containsKey("paginas[0].perguntas");
        erros.clear();
        validar(TipoPagina.QUESTIONARIO, obj());
        assertThat(erros).containsKey("paginas[0].perguntas");
    }

    @Test
    void alternativasDe2A5() {
        for (int n : new int[]{2, 5}) {
            ObjectNode q = obj();
            q.putArray("perguntas").add(pergunta(n, 0));
            assertThat(validar(TipoPagina.QUESTIONARIO, q)).isNotNull();
        }
        for (int n : new int[]{1, 6}) {
            erros.clear();
            ObjectNode q = obj();
            q.putArray("perguntas").add(pergunta(n, 0));
            validar(TipoPagina.QUESTIONARIO, q);
            assertThat(erros).containsKey("paginas[0].perguntas[0].alternativas");
        }
    }

    @Test
    void corretaForaDoIntervaloOuAusenteEhRecusada() {
        for (Integer correta : new Integer[]{-1, 3, null}) {
            erros.clear();
            ObjectNode q = obj();
            q.putArray("perguntas").add(pergunta(3, correta));
            validar(TipoPagina.QUESTIONARIO, q);
            assertThat(erros).containsKey("paginas[0].perguntas[0].correta");
        }
        erros.clear();
        ObjectNode q = obj();
        q.putArray("perguntas").add(pergunta(3, 2));
        assertThat(validar(TipoPagina.QUESTIONARIO, q)).isNotNull();
    }

    @Test
    void enunciadoEAlternativasObrigatoriosENosLimites() {
        ObjectNode q = obj();
        ArrayNode lista = q.putArray("perguntas");
        lista.add(pergunta(3, 0).put("enunciado", "a".repeat(500)));
        ObjectNode semEnunciado = pergunta(3, 0);
        semEnunciado.remove("enunciado");
        lista.add(semEnunciado);
        lista.add(pergunta(3, 0).put("enunciado", "a".repeat(501)));
        ObjectNode altVazia = pergunta(3, 0);
        ((ArrayNode) altVazia.get("alternativas")).set(1, mapper.getNodeFactory().stringNode(" "));
        lista.add(altVazia);
        ObjectNode altLonga = pergunta(3, 0);
        ((ArrayNode) altLonga.get("alternativas")).set(2, mapper.getNodeFactory().stringNode("a".repeat(201)));
        lista.add(altLonga);

        assertThat(validar(TipoPagina.QUESTIONARIO, q)).isNull();
        assertThat(erros).containsOnlyKeys("paginas[0].perguntas[1].enunciado", "paginas[0].perguntas[2].enunciado",
                "paginas[0].perguntas[3].alternativas[1]", "paginas[0].perguntas[4].alternativas[2]");
    }
}
