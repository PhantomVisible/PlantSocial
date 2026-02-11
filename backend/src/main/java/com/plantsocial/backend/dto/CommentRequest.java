package com.plantsocial.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "Content cannot be empty") String content) {
}
