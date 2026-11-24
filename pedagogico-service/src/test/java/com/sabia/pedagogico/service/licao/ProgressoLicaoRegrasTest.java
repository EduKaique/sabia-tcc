package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.TipoPagina;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ProgressoLicaoRegrasTest {

    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 17, 12, 0);

    private static PaginaLicao pagina(long id, TipoPagina tipo) {
        return PaginaLicao.builder().id(id).tipo(tipo).build();
    }

    @Test
    void conclusaoDaPaginaPorTipo() {
        ProgressoPagina tudo = ProgressoPagina.builder().vistaEm(T).videoConferidoEm(T).aprovadoEm(T).build();
        ProgressoPagina soVista = ProgressoPagina.builder().vistaEm(T).build();

        assertThat(soVista.concluida(TipoPagina.TEXTO)).isTrue();
        assertThat(soVista.concluida(TipoPagina.IMAGEM_TEXTO)).isTrue();
        assertThat(soVista.concluida(TipoPagina.VIDEO_YOUTUBE)).isFalse();
        assertThat(soVista.concluida(TipoPagina.QUESTIONARIO)).isFalse();
        assertThat(tudo.concluida(TipoPagina.VIDEO_YOUTUBE)).isTrue();
        assertThat(tudo.concluida(TipoPagina.QUESTIONARIO)).isTrue();
        assertThat(tudo.concluida(TipoPagina.VIDEO_UPLOAD)).isFalse();
        assertThat(ProgressoLicaoRegras.paginaConcluida(pagina(1, TipoPagina.TEXTO), null)).isFalse();
    }

    @Test
    void segundosNecessariosArredondaParaCima() {
        assertThat(ProgressoLicaoRegras.segundosNecessarios(10)).isEqualTo(7);
        assertThat(ProgressoLicaoRegras.segundosNecessarios(11)).isEqualTo(8);
        assertThat(ProgressoLicaoRegras.segundosNecessarios(100)).isEqualTo(70);
        assertThat(ProgressoLicaoRegras.segundosNecessarios(10_800)).isEqualTo(7_560);
    }

    @Test
    void estadosDaLicao() {
        PaginaLicao texto = pagina(1, TipoPagina.TEXTO);
        PaginaLicao video = pagina(2, TipoPagina.VIDEO_YOUTUBE);
        List<PaginaLicao> paginas = List.of(texto, video);
        ProgressoPagina vistaTexto = ProgressoPagina.builder().pagina(texto).vistaEm(T).build();
        ProgressoPagina videoParcial = ProgressoPagina.builder().pagina(video).segundosVideo(3).build();
        ProgressoPagina videoConferido = ProgressoPagina.builder().pagina(video).videoConferidoEm(T).build();
        ProgressoLicao concluida = ProgressoLicao.builder().concluidaEm(T).build();

        assertThat(ProgressoLicaoRegras.estado(paginas, Map.of(), null)).isEqualTo(EstadoLicaoAluno.NAO_INICIADA);
        assertThat(ProgressoLicaoRegras.estado(paginas, Map.of(2L, videoParcial), null))
                .isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
        assertThat(ProgressoLicaoRegras.estado(paginas, Map.of(1L, vistaTexto), null))
                .isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
        assertThat(ProgressoLicaoRegras.estado(paginas, Map.of(1L, vistaTexto, 2L, videoConferido), null))
                .isEqualTo(EstadoLicaoAluno.PRATICA_LIBERADA);
        assertThat(ProgressoLicaoRegras.estado(paginas, Map.of(), concluida)).isEqualTo(EstadoLicaoAluno.CONCLUIDA);
        assertThat(ProgressoLicaoRegras.estado(List.of(), Map.of(), null)).isEqualTo(EstadoLicaoAluno.PRATICA_LIBERADA);
    }

    @Test
    void praticaLiberada() {
        PaginaLicao texto = pagina(1, TipoPagina.TEXTO);
        ProgressoPagina vista = ProgressoPagina.builder().pagina(texto).vistaEm(T).build();

        assertThat(ProgressoLicaoRegras.praticaLiberada(List.of(), Map.of(), null)).isTrue();
        assertThat(ProgressoLicaoRegras.praticaLiberada(List.of(texto), Map.of(), null)).isFalse();
        assertThat(ProgressoLicaoRegras.praticaLiberada(List.of(texto), Map.of(1L, vista), null)).isTrue();
        assertThat(ProgressoLicaoRegras.praticaLiberada(List.of(texto), Map.of(),
                ProgressoLicao.builder().concluidaEm(T).build())).isTrue();
    }
}
