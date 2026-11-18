package com.sabia.pedagogico.service.licao;

import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;

import java.util.List;
import java.util.Map;

/**
 * Regras do progresso do aluno na lição, sem acesso a banco. Uma lição concluída (concluidaEm) nunca regride,
 * mesmo que o professor acrescente páginas depois.
 */
public final class ProgressoLicaoRegras {

    /** Fração mínima (%) da duração do vídeo que precisa ser creditada pelos pulsos. */
    public static final int PERCENTUAL_MINIMO_VIDEO = 70;

    private ProgressoLicaoRegras() {}

    /** ceil(70% da duração), em inteiros. */
    public static int segundosNecessarios(int duracaoSegundos) {
        return (duracaoSegundos * PERCENTUAL_MINIMO_VIDEO + 99) / 100;
    }

    public static boolean paginaConcluida(PaginaLicao pagina, ProgressoPagina progresso) {
        return progresso != null && progresso.concluida(pagina.getTipo());
    }

    public static int paginasConcluidas(List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina) {
        return (int) paginas.stream().filter(p -> paginaConcluida(p, porPagina.get(p.getId()))).count();
    }

    /** Lição concluída, ou todas as páginas concluídas (lição sem páginas: liberada direto). */
    public static boolean praticaLiberada(List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina,
                                          ProgressoLicao progressoLicao) {
        return concluida(progressoLicao) || paginasConcluidas(paginas, porPagina) == paginas.size();
    }

    /**
     * NAO_INICIADA só quando não há nenhum progresso de página nem de prática; qualquer interação registrada
     * (página vista, pulso, tentativa de questionário, autosave) já conta como EM_ANDAMENTO.
     */
    public static EstadoLicaoAluno estado(List<PaginaLicao> paginas, Map<Long, ProgressoPagina> porPagina,
                                          ProgressoLicao progressoLicao) {
        if (concluida(progressoLicao)) return EstadoLicaoAluno.CONCLUIDA;
        if (paginasConcluidas(paginas, porPagina) == paginas.size()) return EstadoLicaoAluno.PRATICA_LIBERADA;
        boolean algumProgresso = progressoLicao != null
                || paginas.stream().anyMatch(p -> porPagina.containsKey(p.getId()));
        return algumProgresso ? EstadoLicaoAluno.EM_ANDAMENTO : EstadoLicaoAluno.NAO_INICIADA;
    }

    private static boolean concluida(ProgressoLicao progressoLicao) {
        return progressoLicao != null && progressoLicao.getConcluidaEm() != null;
    }
}
