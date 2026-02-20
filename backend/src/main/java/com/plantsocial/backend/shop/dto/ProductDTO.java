package com.plantsocial.backend.shop.dto;

import com.plantsocial.backend.shop.model.Product;
import com.plantsocial.backend.shop.model.ProductCategory;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductDTO(
        UUID id,
        String name,
        String slug,
        String description,
        String shortDescription,
        BigDecimal price,
        BigDecimal compareAtPrice,
        ProductCategory category,
        String imageUrl,
        String images,
        Integer stock,
        String weight,
        String ingredients,
        Double rating,
        Integer reviewCount,
        Boolean featured,
        Boolean inStock) {
    public static ProductDTO from(Product p) {
        return new ProductDTO(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getShortDescription(),
                p.getPrice(),
                p.getCompareAtPrice(),
                p.getCategory(),
                p.getImageUrl(),
                p.getImages(),
                p.getStock(),
                p.getWeight(),
                p.getIngredients(),
                p.getRating(),
                p.getReviewCount(),
                p.getFeatured(),
                p.getStock() > 0);
    }
}
