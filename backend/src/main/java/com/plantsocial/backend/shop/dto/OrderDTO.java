package com.plantsocial.backend.shop.dto;

import com.plantsocial.backend.shop.model.Order;
import com.plantsocial.backend.shop.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderDTO(
        UUID id,
        OrderStatus status,
        BigDecimal totalAmount,
        String shippingAddress,
        String paymentMethod,
        List<OrderItemDTO> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
    public static OrderDTO from(Order order) {
        return new OrderDTO(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingAddress(),
                order.getPaymentMethod(),
                order.getItems().stream().map(OrderItemDTO::from).toList(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
