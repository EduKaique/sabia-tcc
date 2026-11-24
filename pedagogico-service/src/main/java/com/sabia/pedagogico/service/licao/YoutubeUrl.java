package com.sabia.pedagogico.service.licao;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Extrai o id de um vídeo do YouTube a partir do id puro ou de uma URL https de um host conhecido
 * (/watch?v=, /embed/, /shorts/, /live/ e o caminho curto do youtu.be). Qualquer outra coisa: vazio.
 */
public final class YoutubeUrl {

    public static final Pattern ID = Pattern.compile("[A-Za-z0-9_-]{11}");

    private static final Set<String> HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com",
            "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com");
    private static final String HOST_CURTO = "youtu.be";
    private static final Set<String> PREFIXOS = Set.of("embed", "shorts", "live");

    private YoutubeUrl() {}

    public static Optional<String> extrairId(String entrada) {
        if (entrada == null) return Optional.empty();
        String valor = entrada.trim();
        if (ID.matcher(valor).matches()) return Optional.of(valor);

        URI uri;
        try {
            uri = new URI(valor);
        } catch (URISyntaxException e) {
            return Optional.empty();
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || uri.getRawUserInfo() != null || uri.getPort() != -1) {
            return Optional.empty();
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        String[] partes = segmentos(uri.getPath());

        String id = null;
        if (HOST_CURTO.equals(host)) {
            if (partes.length == 1) id = partes[0];
        } else if (HOSTS.contains(host)) {
            if (partes.length == 1 && partes[0].equals("watch")) {
                id = parametroV(uri.getRawQuery());
            } else if (partes.length == 2 && PREFIXOS.contains(partes[0])) {
                id = partes[1];
            }
        }
        return id != null && ID.matcher(id).matches() ? Optional.of(id) : Optional.empty();
    }

    private static String[] segmentos(String caminho) {
        if (caminho == null) return new String[0];
        String limpo = caminho.replaceAll("^/+|/+$", "");
        return limpo.isEmpty() ? new String[0] : limpo.split("/");
    }

    private static String parametroV(String query) {
        if (query == null) return null;
        for (String par : query.split("&")) {
            if (par.startsWith("v=")) return par.substring(2);
        }
        return null;
    }
}
