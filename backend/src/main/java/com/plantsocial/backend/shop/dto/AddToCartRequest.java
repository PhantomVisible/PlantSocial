package com.plantsocial.backend.shop.dto;

import java.util.UUID;

public record AddToCartRequest(
        UUID productId,
        Integer quantity) {
}
