package com.plantsocial.backend.shop;

import com.plantsocial.backend.shop.dto.CheckoutRequest;
import com.plantsocial.backend.shop.dto.OrderDTO;
import com.plantsocial.backend.shop.model.*;
import com.plantsocial.backend.shop.repository.CartItemRepository;
import com.plantsocial.backend.shop.repository.OrderRepository;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional
    public OrderDTO checkout(User user, CheckoutRequest request) {
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByAddedAtDesc(user);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Calculate total
        BigDecimal total = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.CONFIRMED)
                .totalAmount(total)
                .shippingAddress(request.shippingAddress())
                .paymentMethod(request.paymentMethod())
                .build();

        // Create order items from cart
        List<OrderItem> orderItems = cartItems.stream().map(cartItem -> {
            // Reduce stock
            Product product = cartItem.getProduct();
            product.setStock(product.getStock() - cartItem.getQuantity());

            return OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();
        }).toList();

        order.setItems(orderItems);
        Order saved = orderRepository.save(order);

        // Clear cart
        cartItemRepository.deleteAllByUser(user);

        return OrderDTO.from(saved);
    }

    public List<OrderDTO> getOrderHistory(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(OrderDTO::from).toList();
    }

    public OrderDTO getOrderById(User user, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        return OrderDTO.from(order);
    }
}
