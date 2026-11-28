package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.AtualizarProjetoSandboxRequest;
import com.sabia.pedagogico.dto.request.CriarProjetoSandboxRequest;
import com.sabia.pedagogico.dto.response.ProjetoSandboxDetalheResponse;
import com.sabia.pedagogico.dto.response.ProjetoSandboxResumoResponse;
import com.sabia.pedagogico.exception.ErroCodificadoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.atividade.StatusSubmissao;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.sandbox.ProjetoSandbox;
import com.sabia.pedagogico.repository.ProjetoSandboxRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.service.sandbox.CenariosProntosRobo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Projetos do Sandbox ("Meus Projetos"): privados do aluno, sem nota, sem entrega e sem validação
 * no servidor. O dono vem sempre do token; projeto de outro aluno responde 404.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProjetoSandboxService {

    static final int LIMITE_POR_ALUNO = 10;
    static final int TAMANHO_MAXIMO_BYTES = 1024 * 1024;
    static final int NOME_MAXIMO = 100;
    static final String NOME_PADRAO = "Projeto sem título";

    static final String CODIGO_LIMITE = "SANDBOX_LIMITE_PROJETOS";
    static final String CODIGO_GRANDE = "SANDBOX_PROJETO_GRANDE";
    static final String CODIGO_JSON_INVALIDO = "SANDBOX_JSON_INVALIDO";
    static final String CODIGO_NAO_CORRIGIDA = "SANDBOX_SUBMISSAO_NAO_CORRIGIDA";

    private final ProjetoSandboxRepository projetoSandboxRepository;
    private final SubmissaoAvaliativaRepository submissaoAvaliativaRepository;
    private final CenarioRoboValidador cenarioRoboValidador;
    private final ObjectMapper objectMapper;

    public List<ProjetoSandboxResumoResponse> listar(Long alunoId) {
        return projetoSandboxRepository.findByAlunoIdOrderByAtualizadoEmDesc(alunoId).stream()
                .map(ProjetoSandboxResumoResponse::from)
                .toList();
    }

    public ProjetoSandboxDetalheResponse buscar(Long alunoId, Long id) {
        return ProjetoSandboxDetalheResponse.from(buscarDoAluno(alunoId, id));
    }

    @Transactional
    public ProjetoSandboxDetalheResponse criar(Long alunoId, CriarProjetoSandboxRequest request) {
        String cenarioJson = null;
        if (request.modo() == ModoPratica.JOGO_ROBO) {
            cenarioJson = CenariosProntosRobo.porId(request.cenario())
                    .orElseThrow(() -> new ErroCodificadoException(HttpStatus.BAD_REQUEST, "SANDBOX_CENARIO_INVALIDO",
                            "Escolha um dos cenários prontos do Jogo do Robô."));
            cenarioRoboValidador.validar(cenarioJson);
        }
        ProjetoSandbox projeto = ProjetoSandbox.builder()
                .alunoId(alunoId)
                .nome(normalizarNome(request.nome()))
                .modo(request.modo())
                .cenarioJson(cenarioJson)
                .build();
        return inserir(alunoId, projeto);
    }

    @Transactional
    public ProjetoSandboxDetalheResponse atualizar(Long alunoId, Long id, AtualizarProjetoSandboxRequest request) {
        if (request.nome() == null && request.estadoJson() == null) {
            throw new ErroCodificadoException(HttpStatus.BAD_REQUEST, "SANDBOX_ATUALIZACAO_VAZIA",
                    "Informe o nome ou o estado do projeto.");
        }
        ProjetoSandbox projeto = buscarDoAluno(alunoId, id);
        if (request.nome() != null) {
            projeto.setNome(normalizarNome(request.nome()));
        }
        if (request.estadoJson() != null) {
            validarJson(request.estadoJson());
            validarTamanho(request.estadoJson(), projeto.getCenarioJson());
            projeto.setEstadoJson(request.estadoJson());
        }
        // saveAndFlush dispara o @PreUpdate e devolve atualizadoEm já preenchido.
        ProjetoSandbox salvo = projetoSandboxRepository.saveAndFlush(projeto);
        return ProjetoSandboxDetalheResponse.from(salvo);
    }

    @Transactional
    public void excluir(Long alunoId, Long id) {
        ProjetoSandbox projeto = buscarDoAluno(alunoId, id);
        projetoSandboxRepository.delete(projeto);
        log.info("Projeto do Sandbox id={} excluído por aluno id={}", id, alunoId);
    }

    /**
     * "Continuar no Sandbox": copia o projeto entregue de uma atividade corrigida para a galeria do
     * aluno. A submissão não é alterada.
     */
    @Transactional
    public ProjetoSandboxDetalheResponse copiarDaAtividade(Long alunoId, Long atividadeId) {
        SubmissaoAvaliativa sub = submissaoAvaliativaRepository.findByAlunoIdAndAtividadeId(alunoId, atividadeId)
                .orElseThrow(() -> new ResourceNotFoundException("Você ainda não entregou esta atividade."));
        if (sub.getStatus() != StatusSubmissao.CORRIGIDA) {
            throw new ErroCodificadoException(HttpStatus.CONFLICT, CODIGO_NAO_CORRIGIDA,
                    "Só é possível continuar no Sandbox depois que a atividade for corrigida.");
        }
        AtividadeAvaliativa atividade = sub.getAtividade();
        boolean robo = atividade.getModo() == ModoPratica.JOGO_ROBO;
        String estadoJson = sub.getProjeto() != null ? sub.getProjeto().getEstadoJson() : null;
        String cenarioJson = robo ? atividade.getCenarioJson() : null;
        validarTamanho(estadoJson, cenarioJson);

        ProjetoSandbox projeto = ProjetoSandbox.builder()
                .alunoId(alunoId)
                .nome(normalizarNome(nomeDaCopia(atividade.getTitulo())))
                .modo(robo ? ModoPratica.JOGO_ROBO : ModoPratica.BLOCOS)
                .estadoJson(estadoJson)
                .cenarioJson(cenarioJson)
                .origemAtividadeId(atividade.getId())
                .build();
        return inserir(alunoId, projeto);
    }

    /** Contagem e inserção na mesma transação (suficiente para o MVP). */
    private ProjetoSandboxDetalheResponse inserir(Long alunoId, ProjetoSandbox projeto) {
        if (projetoSandboxRepository.countByAlunoId(alunoId) >= LIMITE_POR_ALUNO) {
            throw new ErroCodificadoException(HttpStatus.CONFLICT, CODIGO_LIMITE,
                    "Você atingiu o limite de " + LIMITE_POR_ALUNO + " projetos. Exclua um para criar outro.");
        }
        ProjetoSandbox salvo = projetoSandboxRepository.save(projeto);
        log.info("Projeto do Sandbox criado id={} modo={} por aluno id={} (origem atividade={})",
                salvo.getId(), salvo.getModo(), alunoId, salvo.getOrigemAtividadeId());
        return ProjetoSandboxDetalheResponse.from(salvo);
    }

    private ProjetoSandbox buscarDoAluno(Long alunoId, Long id) {
        return projetoSandboxRepository.findByIdAndAlunoId(id, alunoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado."));
    }

    static String normalizarNome(String nome) {
        String aparado = nome == null ? "" : nome.trim();
        if (aparado.isEmpty()) return NOME_PADRAO;
        return aparado.length() > NOME_MAXIMO ? aparado.substring(0, NOME_MAXIMO).trim() : aparado;
    }

    /** "[Título] — cópia", com o título aparado e cortado para o sufixo caber nos 100 caracteres. */
    static String nomeDaCopia(String titulo) {
        String sufixo = " — cópia";
        String base = titulo == null ? "" : titulo.trim();
        if (base.isEmpty()) return NOME_PADRAO;
        int maximo = NOME_MAXIMO - sufixo.length();
        if (base.length() > maximo) base = base.substring(0, maximo).trim();
        return base + sufixo;
    }

    private void validarJson(String estadoJson) {
        try {
            objectMapper.readTree(estadoJson);
        } catch (JacksonException e) {
            throw new ErroCodificadoException(HttpStatus.BAD_REQUEST, CODIGO_JSON_INVALIDO,
                    "O estado do projeto não é um JSON válido.");
        }
    }

    private void validarTamanho(String estadoJson, String cenarioJson) {
        if (bytes(estadoJson) + bytes(cenarioJson) > TAMANHO_MAXIMO_BYTES) {
            throw new ErroCodificadoException(HttpStatus.BAD_REQUEST, CODIGO_GRANDE,
                    "O projeto passou do limite de 1 MB. Remova alguns blocos para salvar.");
        }
    }

    private static long bytes(String texto) {
        return texto == null ? 0 : texto.getBytes(StandardCharsets.UTF_8).length;
    }
}
