package com.plantsocial.backend.shop.dto;

import com.plantsocial.backend.shop.model.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemDTO(
        UUID id,
        UUID productId,
        String productName,
        String productImageUrl,
        Integer quantity,
        BigDecimal priceAtPurchase,
        BigDecimal subtotal) {
    public static OrderItemDTO from(OrderItem item) {
        return new OrderItemDTO(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImageUrl(),
                item.getQuantity(),
                item.getPriceAtPurchase(),
                item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())));
    }
}
