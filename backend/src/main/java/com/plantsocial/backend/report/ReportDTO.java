package com.plantsocial.backend.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportDTO(
        @NotNull(message = "Post ID is required") Long postId,

        @NotNull(message = "Reason is required") String reason,

        @Size(max = 500, message = "Description must be under 500 characters") String description) {
}
