package com.sabia.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SubmeterAtividadeRequest(
        @NotBlank String estadoJson
) {}
