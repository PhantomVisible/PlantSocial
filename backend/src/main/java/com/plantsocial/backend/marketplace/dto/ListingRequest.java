package com.plantsocial.backend.marketplace.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ListingRequest(
                String productUrl,

                @NotBlank(message = "Image URL is required") String imageUrl,

                @NotBlank(message = "Title is required") String title,

                String description,

                java.util.List<String> additionalImages,

                BigDecimal productPrice,

                @NotNull(message = "Duration is required") @Min(value = 1, message = "Duration must be at least 1 day") Integer durationDays) {
}
