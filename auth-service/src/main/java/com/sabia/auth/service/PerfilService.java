package com.sabia.auth.service;

import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.dto.request.EditarPerfilRequest;
import com.sabia.auth.dto.request.PerfilRequest;
import com.sabia.auth.dto.response.EditarPerfilResponse;
import com.sabia.auth.dto.response.PerfilResponse;
import com.sabia.auth.dto.response.PerfilStatusResponse;
import com.sabia.auth.exception.CampoInvalidoException;
import com.sabia.auth.exception.CpfJaCadastradoException;
import com.sabia.auth.exception.MatriculaJaCadastradaException;
import com.sabia.auth.exception.PedagogicoIndisponivelException;
import com.sabia.auth.exception.PerfilNaoAplicavelException;
import com.sabia.auth.messaging.PerfilAlunoAtualizadoEvent;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.AvatarCatalogo;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final JwtTokenProvider jwtTokenProvider;
    private final PedagogicoClient pedagogicoClient;

    static final String AVISO_NOME_PENDENTE = "Nome salvo; pode levar alguns minutos para aparecer nas atividades.";

    /** Resposta da edição e se o nome novo do aluno precisa ser levado ao pedagógico (após o commit). */
    public record ResultadoEdicao(EditarPerfilResponse resposta, boolean propagarNome) {}

    @Transactional
    public void completarPerfil(Usuario usuarioAutenticado, PerfilRequest request) {
        if (usuarioAutenticado.getTipoPerfil() != PerfilUsuario.ALUNO) {
            throw new PerfilNaoAplicavelException();
        }

        if (!request.cpf().equals(usuarioAutenticado.getCpf()) && usuarioRepository.existsByCpf(request.cpf())) {
            throw new CpfJaCadastradoException();
        }
        String matricula = Aluno.normalizarMatricula(request.matricula());
        if (alunoRepository.existsByMatriculaAndIdNot(matricula, usuarioAutenticado.getId())) {
            throw new MatriculaJaCadastradaException();
        }

        Aluno aluno = alunoRepository.findById(usuarioAutenticado.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Aluno não encontrado para usuário id=" + usuarioAutenticado.getId()));

        usuarioAutenticado.setNome(request.nomeCompleto());
        usuarioAutenticado.setCpf(request.cpf());
        usuarioRepository.save(usuarioAutenticado);

        aluno.setMatricula(matricula);
        aluno.setAvatar(request.avatar());
        aluno.setPerfilCompleto(true);
        alunoRepository.save(aluno);

        eventPublisher.publishEvent(new PerfilAlunoAtualizadoEvent(usuarioAutenticado.getId(), request.nomeCompleto()));
        log.info("Perfil completado para aluno id={}", usuarioAutenticado.getId());
    }

    @Transactional(readOnly = true)
    public PerfilStatusResponse status(Usuario usuarioAutenticado) {
        if (usuarioAutenticado.getTipoPerfil() != PerfilUsuario.ALUNO) {
            return new PerfilStatusResponse(true);
        }

        boolean completo = alunoRepository.findById(usuarioAutenticado.getId())
                .map(Aluno::isPerfilCompleto)
                .orElse(false);
        return new PerfilStatusResponse(completo);
    }

    @Transactional(readOnly = true)
    public PerfilResponse consultar(Usuario usuarioAutenticado) {
        Aluno aluno = usuarioAutenticado.getTipoPerfil() == PerfilUsuario.ALUNO
                ? alunoRepository.findById(usuarioAutenticado.getId()).orElse(null)
                : null;
        return new PerfilResponse(
                usuarioAutenticado.getNome(),
                usuarioAutenticado.getEmail(),
                usuarioAutenticado.getTipoPerfil().name(),
                aluno == null ? null : aluno.getMatricula(),
                aluno == null ? null : aluno.getAvatar());
    }

    /**
     * Edita nome (qualquer perfil) e avatar (só aluno; nulo mantém o atual). Devolve um token novo
     * com o nome atualizado. A propagação ao pedagógico fica para depois do commit
     * ({@link #propagarNomeAluno}), chamada por quem invoca este método.
     */
    @Transactional
    public ResultadoEdicao editar(Usuario usuarioAutenticado, EditarPerfilRequest request) {
        boolean ehAluno = usuarioAutenticado.getTipoPerfil() == PerfilUsuario.ALUNO;
        if (!ehAluno && request.avatar() != null) {
            throw new CampoInvalidoException("avatar", "Avatar não se aplica ao perfil de professor.");
        }
        if (ehAluno && request.avatar() != null && !AvatarCatalogo.contem(request.avatar())) {
            throw new CampoInvalidoException("avatar", "Avatar inválido.");
        }

        boolean nomeMudou = !request.nome().equals(usuarioAutenticado.getNome());
        usuarioAutenticado.setNome(request.nome());
        usuarioRepository.save(usuarioAutenticado);

        String avatar = null;
        if (ehAluno) {
            Aluno aluno = alunoRepository.findById(usuarioAutenticado.getId())
                    .orElseThrow(() -> new IllegalStateException(
                            "Aluno não encontrado para usuário id=" + usuarioAutenticado.getId()));
            if (request.avatar() != null) {
                aluno.setAvatar(request.avatar());
                alunoRepository.save(aluno);
            }
            avatar = aluno.getAvatar();
            if (nomeMudou) {
                eventPublisher.publishEvent(new PerfilAlunoAtualizadoEvent(usuarioAutenticado.getId(), request.nome()));
            }
        }

        log.info("Perfil editado pelo próprio usuário id={}", usuarioAutenticado.getId());
        var resposta = new EditarPerfilResponse(usuarioAutenticado.getNome(), avatar,
                jwtTokenProvider.generateToken(usuarioAutenticado), null);
        return new ResultadoEdicao(resposta, ehAluno && nomeMudou);
    }

    /**
     * Leva o nome novo do aluno ao pedagógico, fora da transação. Falha não desfaz a edição:
     * devolve o aviso para a resposta (o evento de perfil, quando a mensageria está ligada,
     * faz a mesma atualização depois). Sem transação de propósito.
     */
    public String propagarNomeAluno(Long alunoId, String nome) {
        try {
            pedagogicoClient.atualizarNomeAluno(alunoId, nome);
            return null;
        } catch (PedagogicoIndisponivelException e) {
            log.warn("Nome do aluno id={} não propagado ao pedagógico: {}", alunoId,
                    e.getCause() == null ? "-" : e.getCause().getClass().getSimpleName());
            return AVISO_NOME_PENDENTE;
        }
    }
}
