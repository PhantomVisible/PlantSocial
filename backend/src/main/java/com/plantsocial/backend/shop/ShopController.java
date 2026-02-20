package com.plantsocial.backend.shop;

import com.plantsocial.backend.shop.dto.*;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ProductService productService;
    private final CartService cartService;
    private final OrderService orderService;

    // ═══════════════════════════════════════════════════════
    // PRODUCTS (public)
    // ═══════════════════════════════════════════════════════

    @GetMapping("/products")
    public ResponseEntity<List<ProductDTO>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productService.getAllProducts(category, sort, search));
    }

    @GetMapping("/products/featured")
    public ResponseEntity<List<ProductDTO>> getFeaturedProducts() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    @GetMapping("/products/{slug}")
    public ResponseEntity<ProductDTO> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    // ═══════════════════════════════════════════════════════
    // CART (authenticated)
    // ═══════════════════════════════════════════════════════

    @GetMapping("/cart")
    public ResponseEntity<Map<String, Object>> getCart(Principal principal) {
        User user = extractUser(principal);
        List<CartItemDTO> items = cartService.getCart(user);
        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", cartService.getCartTotal(user),
                "itemCount", cartService.getCartItemCount(user)));
    }

    @PostMapping("/cart")
    public ResponseEntity<CartItemDTO> addToCart(
            Principal principal,
            @RequestBody AddToCartRequest request) {
        User user = extractUser(principal);
        int qty = request.quantity() != null ? request.quantity() : 1;
        return ResponseEntity.ok(cartService.addToCart(user, request.productId(), qty));
    }

    @PutMapping("/cart/{itemId}")
    public ResponseEntity<CartItemDTO> updateCartItem(
            Principal principal,
            @PathVariable UUID itemId,
            @RequestBody Map<String, Integer> body) {
        User user = extractUser(principal);
        return ResponseEntity.ok(cartService.updateQuantity(user, itemId, body.get("quantity")));
    }

    @DeleteMapping("/cart/{itemId}")
    public ResponseEntity<Void> removeCartItem(
            Principal principal,
            @PathVariable UUID itemId) {
        User user = extractUser(principal);
        cartService.removeItem(user, itemId);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════
    // ORDERS (authenticated)
    // ═══════════════════════════════════════════════════════

    @PostMapping("/checkout")
    public ResponseEntity<OrderDTO> checkout(
            Principal principal,
            @RequestBody CheckoutRequest request) {
        User user = extractUser(principal);
        return ResponseEntity.ok(orderService.checkout(user, request));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDTO>> getOrders(Principal principal) {
        User user = extractUser(principal);
        return ResponseEntity.ok(orderService.getOrderHistory(user));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDTO> getOrderDetail(
            Principal principal,
            @PathVariable UUID id) {
        User user = extractUser(principal);
        return ResponseEntity.ok(orderService.getOrderById(user, id));
    }

    // ═══════════════════════════════════════════════════════

    private User extractUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken token) {
            Object p = token.getPrincipal();
            if (p instanceof User user)
                return user;
        }
        throw new RuntimeException("Not authenticated");
    }
}
