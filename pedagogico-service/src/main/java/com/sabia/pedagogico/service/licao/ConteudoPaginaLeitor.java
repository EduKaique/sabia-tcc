package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.dto.response.ConteudoPaginaAluno;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina.ConteudoImagemTexto;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina.ConteudoQuestionario;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina.ConteudoTexto;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina.ConteudoVideoYoutube;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Lê o conteúdo gravado de uma página (JSON normalizado pelo ValidadorConteudoPagina) e monta a visão do aluno
 * campo a campo. O JSON gravado nunca é devolvido ao aluno: no questionário ele contém o gabarito.
 */
@Component
@RequiredArgsConstructor
public class ConteudoPaginaLeitor {

    private final ObjectMapper objectMapper;

    public ConteudoVideoYoutube video(PaginaLicao pagina) {
        return objectMapper.readValue(pagina.getConteudoJson(), ConteudoVideoYoutube.class);
    }

    public ConteudoQuestionario questionario(PaginaLicao pagina) {
        return objectMapper.readValue(pagina.getConteudoJson(), ConteudoQuestionario.class);
    }

    /** Visão do aluno; VIDEO_UPLOAD (que não existe nas lições publicadas) vira null. */
    public ConteudoPaginaAluno paraAluno(PaginaLicao pagina) {
        return switch (pagina.getTipo()) {
            case TEXTO -> {
                var c = objectMapper.readValue(pagina.getConteudoJson(), ConteudoTexto.class);
                yield new ConteudoPaginaAluno.Texto(c.html());
            }
            case IMAGEM_TEXTO -> {
                var c = objectMapper.readValue(pagina.getConteudoJson(), ConteudoImagemTexto.class);
                yield new ConteudoPaginaAluno.ImagemTexto(c.imagemUrl(), c.alt(), c.legenda(), c.html());
            }
            case VIDEO_YOUTUBE -> {
                var c = video(pagina);
                yield new ConteudoPaginaAluno.VideoYoutube(c.videoId(), c.titulo(), c.canal(), c.duracaoSegundos());
            }
            case QUESTIONARIO -> {
                var c = questionario(pagina);
                yield new ConteudoPaginaAluno.Questionario(c.percentualMinimo(), c.perguntas().stream()
                        .map(p -> new ConteudoPaginaAluno.Pergunta(p.enunciado(), p.alternativas()))
                        .toList());
            }
            case VIDEO_UPLOAD -> null;
        };
    }
}
