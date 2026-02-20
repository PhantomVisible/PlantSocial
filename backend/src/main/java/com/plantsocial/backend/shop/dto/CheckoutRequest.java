package com.plantsocial.backend.shop.dto;

public record CheckoutRequest(
        String shippingAddress,
        String paymentMethod,
        String notes) {
}
