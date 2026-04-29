package com.plantsocial.backend.marketplace.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductPreviewDTO(
        String title,
        List<String> imageUrls,
        String description,
        String url,
        BigDecimal productPrice,
        String currency) {
}
