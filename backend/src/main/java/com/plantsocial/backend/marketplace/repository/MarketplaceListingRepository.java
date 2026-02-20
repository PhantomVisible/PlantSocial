package com.plantsocial.backend.marketplace.repository;

import com.plantsocial.backend.marketplace.model.MarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, UUID> {

    @Modifying
    @Query("UPDATE MarketplaceListing m SET m.status = 'EXPIRED' WHERE m.expiryDate < CURRENT_TIMESTAMP AND m.status = 'ACTIVE'")
    int expireListings();
}
