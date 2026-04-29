package com.plantsocial.backend.marketplace.dto;

import com.plantsocial.backend.marketplace.model.ListingStatus;
import com.plantsocial.backend.marketplace.model.MarketplaceListing;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
        List<String> additionalImages,
        BigDecimal productPrice,
        BigDecimal pricePerDay,
        Integer durationDays,
        BigDecimal totalCost,
        ListingStatus status,
        LocalDateTime expiryDate,
        LocalDateTime createdAt,
        boolean isPromoted,
        boolean freeBoostUsed,
        Integer clickCount,
        String userSubscriptionTier,
        List<String> imageUrls,
        BigDecimal originalPrice,
        String currency) {

    public static ListingResponse fromEntity(MarketplaceListing listing) {
        // Build unified image list; prefer the new imageUrls collection, fall back
        // to the legacy imageUrl column so old listings still display correctly.
        List<String> all = new ArrayList<>();
        if (listing.getImageUrls() != null && !listing.getImageUrls().isEmpty()) {
            all.addAll(listing.getImageUrls());
        } else if (listing.getImageUrl() != null) {
            all.add(listing.getImageUrl());
        }

        String primaryImage = all.isEmpty() ? null : all.get(0);
        List<String> extra = all.size() > 1 ? all.subList(1, all.size()) : List.of();

        return new ListingResponse(
                listing.getId(),
                listing.getUser().getId(),
                listing.getUser().getFullName(),
                listing.getUser().getHandle(),
                listing.getProductUrl(),
                primaryImage,
                listing.getTitle(),
                listing.getDescription(),
                extra,
                listing.getProductPrice(),
                listing.getPricePerDay(),
                listing.getDurationDays(),
                listing.getPricePerDay().multiply(BigDecimal.valueOf(listing.getDurationDays())),
                listing.getStatus(),
                listing.getExpiryDate(),
                listing.getCreatedAt(),
                listing.isPromoted(),
                listing.isFreeBoostUsed(),
                listing.getClickCount(),
                listing.getUser().getSubscriptionTier() != null
                        ? listing.getUser().getSubscriptionTier().name()
                        : null,
                all,
                listing.getOriginalPrice(),
                listing.getCurrency());
    }
}
