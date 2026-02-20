package com.plantsocial.backend.marketplace.service;

import com.plantsocial.backend.exception.BusinessException;
import com.plantsocial.backend.marketplace.dto.ListingRequest;
import com.plantsocial.backend.marketplace.dto.ListingResponse;
import com.plantsocial.backend.marketplace.model.ListingStatus;
import com.plantsocial.backend.marketplace.model.MarketplaceListing;
import com.plantsocial.backend.marketplace.repository.MarketplaceListingRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private final MarketplaceListingRepository listingRepository;
    private final UserRepository userRepository;

    private static final BigDecimal PRICE_PER_DAY = new BigDecimal("5.00");

    @Transactional
    public ListingResponse createListing(ListingRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        MarketplaceListing listing = MarketplaceListing.builder()
                .user(user)
                .productUrl(request.productUrl())
                .imageUrl(request.imageUrl())
                .title(request.title())
                .pricePerDay(PRICE_PER_DAY)
                .durationDays(request.durationDays())
                .status(ListingStatus.PENDING_PAYMENT)
                .build();

        MarketplaceListing savedListing = listingRepository.save(listing);
        return ListingResponse.fromEntity(savedListing);
    }

    @Transactional
    public ListingResponse processPayment(UUID listingId) {
        MarketplaceListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new BusinessException("LISTING_NOT_FOUND", "Listing not found"));

        if (listing.getStatus() == ListingStatus.ACTIVE) {
            throw new BusinessException("INVALID_OPERATION", "Listing is already active");
        }

        // Simulate payment success provided by frontend/payment gateway
        listing.setStatus(ListingStatus.ACTIVE);
        // Calculate expiry date: NOW + durationDays
        listing.setExpiryDate(LocalDateTime.now().plusDays(listing.getDurationDays()));

        MarketplaceListing updatedListing = listingRepository.save(listing);
        return ListingResponse.fromEntity(updatedListing);
    }

    public List<ListingResponse> getAllActiveListings() {
        return listingRepository.findAll().stream()
                .filter(l -> l.getStatus() == ListingStatus.ACTIVE)
                .filter(l -> l.getExpiryDate().isAfter(LocalDateTime.now()))
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> getListingsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        return listingRepository.findAll().stream()
                .filter(l -> l.getUser().getId().equals(user.getId()))
                .map(ListingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ListingResponse getListingById(UUID id) {
        return listingRepository.findById(id)
                .map(ListingResponse::fromEntity)
                .orElseThrow(() -> new BusinessException("LISTING_NOT_FOUND", "Listing not found"));
    }

    @Transactional
    public void deleteListing(UUID id, String userEmail) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("LISTING_NOT_FOUND", "Listing not found"));

        if (!listing.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException("ACCESS_DENIED", "You are not authorized to delete this listing");
        }

        listingRepository.delete(listing);
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expireOldListings() {
        int expiredCount = listingRepository.expireListings();
        if (expiredCount > 0) {
            System.out.println("Scheduled Task: Expired " + expiredCount + " marketplace listings.");
        }
    }
}
