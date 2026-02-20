package com.plantsocial.backend.shop.repository;

import com.plantsocial.backend.shop.model.CartItem;
import com.plantsocial.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    List<CartItem> findByUserOrderByAddedAtDesc(User user);

    Optional<CartItem> findByUserAndProductId(User user, UUID productId);

    void deleteAllByUser(User user);

    long countByUser(User user);
}
