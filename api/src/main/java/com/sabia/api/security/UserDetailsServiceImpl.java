package com.sabia.api.security;

import com.sabia.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        try {
            UUID id = UUID.fromString(identifier);
            return usuarioRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + identifier));
        } catch (IllegalArgumentException e) {
            return usuarioRepository.findByEmail(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + identifier));
        }
    }
}
