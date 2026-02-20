package com.plantsocial.backend.shop.dto;

import com.plantsocial.backend.shop.model.CartItem;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemDTO(
        UUID id,
        UUID productId,
        String productName,
        String productSlug,
        String productImageUrl,
        BigDecimal productPrice,
        Integer quantity,
        BigDecimal subtotal) {
    public static CartItemDTO from(CartItem item) {
        return new CartItemDTO(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getSlug(),
                item.getProduct().getImageUrl(),
                item.getProduct().getPrice(),
                item.getQuantity(),
                item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
    }
}
