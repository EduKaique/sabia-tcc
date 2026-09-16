package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SubmeterAtividadeRequest(
        @NotBlank String estadoJson
) {}
