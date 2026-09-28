package com.sabia.auth.service;

import com.sabia.auth.dto.request.PerfilRequest;
import com.sabia.auth.dto.response.PerfilStatusResponse;
import com.sabia.auth.exception.CpfJaCadastradoException;
import com.sabia.auth.exception.MatriculaJaCadastradaException;
import com.sabia.auth.exception.PerfilNaoAplicavelException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;

    @Transactional
    public void completarPerfil(Usuario usuarioAutenticado, PerfilRequest request) {
        if (usuarioAutenticado.getTipoPerfil() != PerfilUsuario.ALUNO) {
            throw new PerfilNaoAplicavelException();
        }

        if (!request.cpf().equals(usuarioAutenticado.getCpf()) && usuarioRepository.existsByCpf(request.cpf())) {
            throw new CpfJaCadastradoException();
        }
        if (alunoRepository.existsByMatriculaAndIdNot(request.matricula(), usuarioAutenticado.getId())) {
            throw new MatriculaJaCadastradaException();
        }

        Aluno aluno = alunoRepository.findById(usuarioAutenticado.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Aluno não encontrado para usuário id=" + usuarioAutenticado.getId()));

        usuarioAutenticado.setNome(request.nomeCompleto());
        usuarioAutenticado.setCpf(request.cpf());
        usuarioRepository.save(usuarioAutenticado);

        aluno.setMatricula(request.matricula());
        aluno.setAvatar(request.avatar());
        aluno.setPerfilCompleto(true);
        alunoRepository.save(aluno);

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
}
