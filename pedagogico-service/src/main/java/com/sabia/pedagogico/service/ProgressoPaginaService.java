package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.CorrecaoQuestionarioResponse;
import com.sabia.pedagogico.dto.response.CorrecaoQuestionarioResponse.PerguntaCorrigida;
import com.sabia.pedagogico.dto.response.PulsoVideoResponse;
import com.sabia.pedagogico.dto.response.VistaPaginaResponse;
import com.sabia.pedagogico.exception.ConteudoInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.service.licao.ConteudoPaginaLeitor;
import com.sabia.pedagogico.service.licao.ProgressoLicaoRegras;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina.ConteudoQuestionario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Progresso do aluno nas páginas: página vista, pulso do vídeo e correção do questionário. O aluno vem sempre do
 * token; página fora da lição da URL ou lição invisível respondem 404. Marcos de conclusão nunca são desfeitos.
 *
 * <p>Concorrência (duas abas, mesmo aluno e página): a linha é criada com INSERT ... ON CONFLICT DO NOTHING e
 * lida com SELECT ... FOR UPDATE ({@link ProgressoPaginaRepository#criarSeAusente} e
 * {@link ProgressoPaginaRepository#buscarParaAtualizar}). A segunda requisição espera a primeira terminar e já
 * vê o ultimo_pulso_em/tentativas gravados, então o crédito do vídeo não duplica e nenhuma tentativa se perde.
 *
 * <p>Logs só com ids: nunca respostas, enunciados ou textos.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProgressoPaginaService {

    /** Crédito máximo por pulso: o front pulsa a cada ~10 s enquanto o vídeo toca. */
    static final Duration TETO_CREDITO_PULSO = Duration.ofSeconds(15);
    /** Intervalo maior que este desde o último pulso = vídeo retomado depois de pausa: crédito 0. */
    static final Duration JANELA_PULSO = Duration.ofSeconds(30);

    private final LicaoService licaoService;
    private final PaginaLicaoRepository paginaRepository;
    private final ProgressoPaginaRepository progressoPaginaRepository;
    private final ConteudoPaginaLeitor leitor;
    private final Clock relogio;

    /** Registra a abertura da página (idempotente). Conclui só TEXTO e IMAGEM_TEXTO. */
    public VistaPaginaResponse marcarVista(Long alunoId, Long licaoId, Long paginaId) {
        PaginaLicao pagina = paginaDaLicao(alunoId, licaoId, paginaId);
        recusarUpload(pagina);
        ProgressoPagina pp = linhaComLock(alunoId, pagina);
        if (pp.getVistaEm() == null) {
            pp.setVistaEm(LocalDateTime.now(relogio));
        }
        return new VistaPaginaResponse(paginaId, pp.concluida(pagina.getTipo()),
                licaoService.praticaLiberada(alunoId, licaoId));
    }

    /**
     * Pulso do player, sem corpo. Com agora = relógio do servidor: se o último pulso foi há no máximo
     * JANELA_PULSO, credita min(intervalo, TETO_CREDITO_PULSO); senão, 0. O crédito não passa da duração e o
     * vídeo é conferido ao atingir ceil(PERCENTUAL_MINIMO_VIDEO% da duração). Depois de conferido, nada muda.
     */
    public PulsoVideoResponse registrarPulso(Long alunoId, Long licaoId, Long paginaId) {
        PaginaLicao pagina = paginaDaLicao(alunoId, licaoId, paginaId);
        recusarUpload(pagina);
        if (pagina.getTipo() != TipoPagina.VIDEO_YOUTUBE) {
            throw new OperacaoInvalidaException("Esta página não é de vídeo.");
        }
        Integer duracao = leitor.video(pagina).duracaoSegundos();
        if (duracao == null) {
            throw new OperacaoInvalidaException("O vídeo desta página está sem duração cadastrada.");
        }
        int necessarios = ProgressoLicaoRegras.segundosNecessarios(duracao);
        ProgressoPagina pp = linhaComLock(alunoId, pagina);
        if (pp.getVideoConferidoEm() == null) {
            LocalDateTime agora = LocalDateTime.now(relogio);
            int segundos = Math.min(valor(pp.getSegundosVideo()) + credito(pp.getUltimoPulsoEm(), agora), duracao);
            pp.setSegundosVideo(segundos);
            pp.setUltimoPulsoEm(agora);
            if (segundos >= necessarios) {
                pp.setVideoConferidoEm(agora);
                log.info("Vídeo conferido: aluno id={} lição id={} página id={}", alunoId, licaoId, paginaId);
            }
        }
        return new PulsoVideoResponse(paginaId, valor(pp.getSegundosVideo()), necessarios,
                pp.getVideoConferidoEm() != null, licaoService.praticaLiberada(alunoId, licaoId));
    }

    /**
     * Corrige uma tentativa (ilimitadas). percentual = acertos * 100 / total (divisão inteira). Vale o melhor
     * percentual, e a aprovação, uma vez alcançada, nunca é desfeita.
     */
    public CorrecaoQuestionarioResponse corrigirQuestionario(Long alunoId, Long licaoId, Long paginaId,
                                                             List<Integer> respostas) {
        PaginaLicao pagina = paginaDaLicao(alunoId, licaoId, paginaId);
        recusarUpload(pagina);
        if (pagina.getTipo() != TipoPagina.QUESTIONARIO) {
            throw new OperacaoInvalidaException("Esta página não é um questionário.");
        }
        ConteudoQuestionario questionario = leitor.questionario(pagina);
        int total = questionario.perguntas().size();
        validarRespostas(questionario, respostas);

        List<PerguntaCorrigida> corrigidas = new ArrayList<>(total);
        int acertos = 0;
        for (int i = 0; i < total; i++) {
            boolean certa = respostas.get(i) == questionario.perguntas().get(i).correta();
            if (certa) acertos++;
            corrigidas.add(new PerguntaCorrigida(certa));
        }
        int percentual = acertos * 100 / total;
        boolean aprovado = percentual >= questionario.percentualMinimo();

        ProgressoPagina pp = linhaComLock(alunoId, pagina);
        pp.setTentativas(valor(pp.getTentativas()) + 1);
        pp.setMelhorPercentual(Math.max(pp.getMelhorPercentual() != null ? pp.getMelhorPercentual() : 0, percentual));
        if (aprovado && pp.getAprovadoEm() == null) {
            pp.setAprovadoEm(LocalDateTime.now(relogio));
            log.info("Questionário aprovado: aluno id={} lição id={} página id={}", alunoId, licaoId, paginaId);
        }
        return new CorrecaoQuestionarioResponse(paginaId, acertos, total, percentual, aprovado,
                pp.getAprovadoEm() != null, pp.getMelhorPercentual(), pp.getTentativas(), corrigidas,
                licaoService.praticaLiberada(alunoId, licaoId));
    }

    // --------- helpers ---------

    /** A lição precisa estar visível ao aluno e a página precisa ser dela; senão 404. */
    private PaginaLicao paginaDaLicao(Long alunoId, Long licaoId, Long paginaId) {
        licaoService.buscarVisivel(alunoId, licaoId);
        return paginaRepository.findById(paginaId)
                .filter(p -> p.getLicao().getId().equals(licaoId))
                .orElseThrow(() -> new ResourceNotFoundException("Página com id " + paginaId + " não encontrada."));
    }

    private static void recusarUpload(PaginaLicao pagina) {
        if (pagina.getTipo() == TipoPagina.VIDEO_UPLOAD) {
            throw new OperacaoInvalidaException("Upload de vídeo ainda não está disponível.");
        }
    }

    /** Cria a linha se preciso e a devolve travada (ver javadoc da classe). */
    private ProgressoPagina linhaComLock(Long alunoId, PaginaLicao pagina) {
        progressoPaginaRepository.criarSeAusente(alunoId, pagina.getId());
        return progressoPaginaRepository.buscarParaAtualizar(alunoId, pagina.getId())
                .orElseThrow(() -> new IllegalStateException("Progresso da página não encontrado após a criação."));
    }

    static int credito(LocalDateTime ultimoPulso, LocalDateTime agora) {
        if (ultimoPulso == null) return 0;
        Duration intervalo = Duration.between(ultimoPulso, agora);
        if (intervalo.isNegative() || intervalo.compareTo(JANELA_PULSO) > 0) return 0;
        return (int) Math.min(intervalo.getSeconds(), TETO_CREDITO_PULSO.getSeconds());
    }

    private static void validarRespostas(ConteudoQuestionario questionario, List<Integer> respostas) {
        int total = questionario.perguntas().size();
        Map<String, String> erros = new LinkedHashMap<>();
        if (respostas.size() != total) {
            erros.put("respostas", "Envie uma resposta para cada uma das " + total + " perguntas.");
        } else {
            for (int i = 0; i < total; i++) {
                int alternativas = questionario.perguntas().get(i).alternativas().size();
                int r = respostas.get(i);
                if (r < 0 || r >= alternativas) {
                    erros.put("respostas[" + i + "]", "Escolha uma das " + alternativas + " alternativas.");
                }
            }
        }
        if (!erros.isEmpty()) throw new ConteudoInvalidoException(erros);
    }

    private static int valor(Integer n) {
        return n != null ? n : 0;
    }
}
