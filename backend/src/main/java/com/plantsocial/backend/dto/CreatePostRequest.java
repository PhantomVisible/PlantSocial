package com.plantsocial.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePostRequest(
                @NotBlank(message = "Content cannot be empty") String content,

                String imageUrl,

                String plantTag) {
}
