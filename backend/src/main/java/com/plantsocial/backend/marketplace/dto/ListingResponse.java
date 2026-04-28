package com.plantsocial.backend.marketplace.dto;

import com.plantsocial.backend.marketplace.model.ListingStatus;
import com.plantsocial.backend.marketplace.model.MarketplaceListing;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ListingResponse(
        UUID id,
        UUID userId,
        String userFullName,
        String userHandle,
        String productUrl,
        String imageUrl,
        String title,
        String description,
        java.util.List<String> additionalImages,
        BigDecimal productPrice,
        BigDecimal pricePerDay,
        Integer durationDays,
        BigDecimal totalCost,
        ListingStatus status,
        LocalDateTime expiryDate,
        LocalDateTime createdAt,
        boolean isPromoted,
        Integer clickCount,
        String userSubscriptionTier) {
    public static ListingResponse fromEntity(MarketplaceListing listing) {
        return new ListingResponse(
                listing.getId(),
                listing.getUser().getId(),
                listing.getUser().getFullName(),
                listing.getUser().getHandle(),
                listing.getProductUrl(),
                listing.getImageUrl(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getAdditionalImages(),
                listing.getProductPrice(),
                listing.getPricePerDay(),
                listing.getDurationDays(),
                listing.getPricePerDay().multiply(BigDecimal.valueOf(listing.getDurationDays())),
                listing.getStatus(),
                listing.getExpiryDate(),
                listing.getCreatedAt(),
                listing.isPromoted(),
                listing.getClickCount(),
                listing.getUser().getSubscriptionTier() != null ? listing.getUser().getSubscriptionTier().name() : null);
    }
}
