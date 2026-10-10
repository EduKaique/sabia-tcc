package com.sabia.auth.service;

import com.sabia.auth.dto.response.AlunoBuscaResponse;
import com.sabia.auth.exception.AcessoNegadoException;
import com.sabia.auth.exception.AlunoNaoEncontradoException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AlunoService {

    private static final Pattern CPF = Pattern.compile("\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}");

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;

    /**
     * Busca exata por e-mail (contém "@"), CPF (11 dígitos, com ou sem máscara) ou matrícula.
     * Um termo com formato de CPF que não bate com nenhum CPF ainda é tentado como matrícula.
     * Não distingue "não existe" de "não é aluno".
     */
    @Transactional(readOnly = true)
    public AlunoBuscaResponse buscar(Usuario solicitante, String termo) {
        if (solicitante.getTipoPerfil() != PerfilUsuario.PROFESSOR) {
            throw new AcessoNegadoException("Apenas professores podem buscar alunos.");
        }
        String t = termo.trim();

        Optional<Usuario> usuario;
        if (t.contains("@")) {
            usuario = usuarioRepository.findByEmail(t);
        } else if (CPF.matcher(t).matches()) {
            usuario = usuarioRepository.findByCpf(t.replaceAll("\\D", ""))
                    .or(() -> buscarPorMatricula(t));
        } else {
            usuario = buscarPorMatricula(t);
        }

        return usuario
                .filter(u -> u.getTipoPerfil() == PerfilUsuario.ALUNO)
                .map(u -> new AlunoBuscaResponse(u.getId(), u.getNome(), u.getEmail()))
                .orElseThrow(AlunoNaoEncontradoException::new);
    }

    private Optional<Usuario> buscarPorMatricula(String matricula) {
        return alunoRepository.findByMatricula(matricula).map(Aluno::getUsuario);
    }
}
