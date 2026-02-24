package com.plantsocial.backend.marketplace.dto;

import java.math.BigDecimal;

public record ProductPreviewDTO(
                String title,
                String imageUrl,
                String description,
                String url,
                BigDecimal productPrice) {
}
