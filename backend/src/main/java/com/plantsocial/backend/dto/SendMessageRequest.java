package com.plantsocial.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Message content is required") String content,

        String messageType // TEXT, IMAGE, FILE (defaults to TEXT if null)
) {
}
