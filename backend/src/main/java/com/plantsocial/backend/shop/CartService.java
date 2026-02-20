package com.plantsocial.backend.shop;

import com.plantsocial.backend.shop.dto.CartItemDTO;
import com.plantsocial.backend.shop.model.CartItem;
import com.plantsocial.backend.shop.model.Product;
import com.plantsocial.backend.shop.repository.CartItemRepository;
import com.plantsocial.backend.shop.repository.ProductRepository;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public List<CartItemDTO> getCart(User user) {
        return cartItemRepository.findByUserOrderByAddedAtDesc(user)
                .stream().map(CartItemDTO::from).toList();
    }

    @Transactional
    public CartItemDTO addToCart(User user, UUID productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStock() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        // If already in cart, increase quantity
        CartItem existing = cartItemRepository.findByUserAndProductId(user, productId).orElse(null);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            return CartItemDTO.from(cartItemRepository.save(existing));
        }

        CartItem item = CartItem.builder()
                .user(user)
                .product(product)
                .quantity(quantity)
                .build();

        return CartItemDTO.from(cartItemRepository.save(item));
    }

    @Transactional
    public CartItemDTO updateQuantity(User user, UUID itemId, int quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
            return null;
        }

        if (item.getProduct().getStock() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        item.setQuantity(quantity);
        return CartItemDTO.from(cartItemRepository.save(item));
    }

    @Transactional
    public void removeItem(User user, UUID itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(User user) {
        cartItemRepository.deleteAllByUser(user);
    }

    public BigDecimal getCartTotal(User user) {
        return cartItemRepository.findByUserOrderByAddedAtDesc(user).stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public long getCartItemCount(User user) {
        return cartItemRepository.countByUser(user);
    }
}
