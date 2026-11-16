package com.sabia.auth.service;

import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.client.PedagogicoClient.AlunoDaTurmaRemoto;
import com.sabia.auth.dto.request.RedefinirSenhaAlunoRequest;
import com.sabia.auth.dto.request.RedefinirSenhaAlunoRequest.Modo;
import com.sabia.auth.dto.response.AlunoDaTurmaResponse;
import com.sabia.auth.dto.response.SenhaAlunoResponse;
import com.sabia.auth.exception.AcessoNegadoException;
import com.sabia.auth.exception.AlunoNaoEncontradoException;
import com.sabia.auth.exception.CampoInvalidoException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.LimiteTentativasLogin;
import com.sabia.auth.service.senha.GeradorSenhaAmigavel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Ações do professor sobre os alunos das turmas dele. O vínculo turma–professor–aluno mora no
 * Serviço Pedagógico: toda operação confirma, por lá, que a turma é do professor (404 se não for).
 * Nunca logar senhas: só ids.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfessorAlunoService {

    private static final int SENHA_DIGITADA_MIN = 8;
    private static final int SENHA_DIGITADA_MAX = 64;

    private final PedagogicoClient pedagogicoClient;
    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeradorSenhaAmigavel geradorSenha;
    private final LimiteTentativasLogin limiteTentativas;

    @Transactional(readOnly = true)
    public List<AlunoDaTurmaResponse> listar(Usuario professor, Long turmaId) {
        exigirProfessor(professor);
        List<AlunoDaTurmaRemoto> remotos = pedagogicoClient.listarAlunosDaTurma(turmaId, professor.getId());

        Map<Long, Aluno> alunos = alunoRepository.findAllById(remotos.stream().map(AlunoDaTurmaRemoto::alunoId).toList())
                .stream()
                .collect(Collectors.toMap(Aluno::getId, Function.identity()));

        return remotos.stream().map(r -> {
            Aluno aluno = alunos.get(r.alunoId());
            Usuario usuario = aluno == null ? null : aluno.getUsuario();
            return new AlunoDaTurmaResponse(
                    r.alunoId(),
                    usuario != null ? usuario.getNome() : r.alunoNome(),
                    aluno != null ? aluno.getMatricula() : null,
                    aluno != null ? aluno.getAvatar() : null,
                    r.ingressoEm() == null ? null : LocalDateTime.parse(r.ingressoEm()),
                    usuario != null && usuario.isMustChangePassword());
        }).toList();
    }

    @Transactional
    public SenhaAlunoResponse redefinirSenha(Usuario professor, Long turmaId, Long alunoId,
                                             RedefinirSenhaAlunoRequest request) {
        exigirProfessor(professor);
        if (request.modo() == Modo.DIGITADA) {
            validarSenhaDigitada(request.senha());
        }

        boolean matriculado = pedagogicoClient.listarAlunosDaTurma(turmaId, professor.getId()).stream()
                .anyMatch(a -> alunoId.equals(a.alunoId()));
        if (!matriculado) {
            throw new AlunoNaoEncontradoException();
        }
        Usuario aluno = usuarioRepository.findById(alunoId)
                .filter(u -> u.getTipoPerfil() == PerfilUsuario.ALUNO)
                .orElseThrow(AlunoNaoEncontradoException::new);

        String senha = request.modo() == Modo.ALEATORIA ? geradorSenha.gerar() : request.senha();
        aluno.setSenhaHash(passwordEncoder.encode(senha));
        aluno.setMustChangePassword(request.exigirTroca());
        usuarioRepository.save(aluno);
        // Senha nova: libera a conta se ela estava bloqueada por tentativas erradas.
        limiteTentativas.liberar(aluno.getEmail(),
                alunoRepository.findById(alunoId).map(Aluno::getMatricula).orElse(null));

        log.info("Senha do aluno id={} redefinida pelo professor id={} (turma id={}, modo={}, exigirTroca={})",
                alunoId, professor.getId(), turmaId, request.modo(), request.exigirTroca());
        return new SenhaAlunoResponse(request.modo() == Modo.ALEATORIA ? senha : null, request.exigirTroca());
    }

    private void exigirProfessor(Usuario usuario) {
        if (usuario.getTipoPerfil() != PerfilUsuario.PROFESSOR) {
            throw new AcessoNegadoException("Apenas professores podem gerenciar alunos da turma.");
        }
    }

    /** Mensagens fixas: nunca repetem o valor digitado. */
    private void validarSenhaDigitada(String senha) {
        if (senha == null || senha.isEmpty()) {
            throw new CampoInvalidoException("senha", "Informe a nova senha.");
        }
        if (!senha.equals(senha.strip())) {
            throw new CampoInvalidoException("senha", "A senha não pode começar nem terminar com espaço.");
        }
        if (senha.length() < SENHA_DIGITADA_MIN || senha.length() > SENHA_DIGITADA_MAX) {
            throw new CampoInvalidoException("senha", "A senha deve ter entre 8 e 64 caracteres.");
        }
    }
}
