package com.sabia.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sabia.jwt")
public record JwtProperties(String secret, long expirationMs) {}
