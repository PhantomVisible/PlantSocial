package com.plantsocial.backend.marketplace.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ListingRequest(
                String productUrl,

                @NotEmpty(message = "At least one image URL is required") List<String> imageUrls,

                @NotNull(message = "Title is required") String title,

                String description,

                BigDecimal productPrice,

                BigDecimal originalPrice,

                String currency,

                @NotNull(message = "Duration is required") @Min(value = 1, message = "Duration must be at least 1 day") Integer durationDays) {
}
