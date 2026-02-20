package com.plantsocial.backend.shop.repository;

import com.plantsocial.backend.shop.model.Product;
import com.plantsocial.backend.shop.model.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySlug(String slug);

    List<Product> findByCategoryAndActiveTrue(ProductCategory category);

    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    List<Product> findByFeaturedTrueAndActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT p FROM Product p WHERE p.active = true AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchByName(@Param("query") String query);

    long countByActiveTrue();
}
