package com.sabia.pedagogico.service.licao;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Extração do id do YouTube: hosts e caminhos aceitos, só https, id com 11 caracteres válidos. */
class YoutubeUrlTest {

    private static final String ID = "dQw4w9WgXcQ";

    @ParameterizedTest(name = "[{index}] {0} -> {1}")
    @CsvSource(delimiter = '|', nullValues = "NENHUM", value = {
            // aceitos
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ                 | dQw4w9WgXcQ",
            "https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ       | dQw4w9WgXcQ",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ                   | dQw4w9WgXcQ",
            "https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RD123    | dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ                                | dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42                 | dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ                   | dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ?start=10          | dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ                  | dQw4w9WgXcQ",
            "https://www.youtube.com/live/dQw4w9WgXcQ?feature=share      | dQw4w9WgXcQ",
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ          | dQw4w9WgXcQ",
            "https://youtube-nocookie.com/embed/dQw4w9WgXcQ              | dQw4w9WgXcQ",
            "https://WWW.YOUTUBE.COM/watch?v=dQw4w9WgXcQ                 | dQw4w9WgXcQ",
            "dQw4w9WgXcQ                                                 | dQw4w9WgXcQ",
            "a-b_C1234Z9                                                 | a-b_C1234Z9",
            // recusados
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ                  | NENHUM",
            "http://youtu.be/dQw4w9WgXcQ                                 | NENHUM",
            "ftp://youtube.com/watch?v=dQw4w9WgXcQ                       | NENHUM",
            "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ            | NENHUM",
            "https://evilyoutube.com/watch?v=dQw4w9WgXcQ                 | NENHUM",
            "https://youtube.com@evil.com/watch?v=dQw4w9WgXcQ            | NENHUM",
            "https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ            | NENHUM",
            "https://www.youtube.com/watch?v=dQw4w9WgXc                  | NENHUM",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQQ                | NENHUM",
            "https://www.youtube.com/watch?v=dQw4w9WgX!Q                 | NENHUM",
            "https://youtu.be/dQw4w9WgXc                                 | NENHUM",
            "https://youtu.be/                                           | NENHUM",
            "https://www.youtube.com/watch                               | NENHUM",
            "https://www.youtube.com/channel/dQw4w9WgXcQ                 | NENHUM",
            "https://www.youtube.com/embed/dQw4w9WgXcQ/extra             | NENHUM",
            "dQw4w9WgXc                                                  | NENHUM",
            "dQw4w9WgXcQQ                                                | NENHUM",
            "dQw4w9Wg$cQ                                                 | NENHUM",
            "javascript:alert(1)                                         | NENHUM",
    })
    void extraiOuRecusa(String entrada, String esperado) {
        assertThat(YoutubeUrl.extrairId(entrada).orElse(null)).isEqualTo(esperado);
    }

    @Test
    void vazioNuloEEspacosSaoRecusados_eIdComEspacosNasPontasEhAparado() {
        assertThat(YoutubeUrl.extrairId(null)).isEmpty();
        assertThat(YoutubeUrl.extrairId("")).isEmpty();
        assertThat(YoutubeUrl.extrairId("   ")).isEmpty();
        assertThat(YoutubeUrl.extrairId("  " + ID + "  ")).contains(ID);
    }
}
