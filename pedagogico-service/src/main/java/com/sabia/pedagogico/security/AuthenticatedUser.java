package com.sabia.pedagogico.security;

public record AuthenticatedUser(Long id, String role, String nome) {}
