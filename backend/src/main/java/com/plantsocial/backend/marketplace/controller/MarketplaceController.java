package com.plantsocial.backend.marketplace.controller;

import com.plantsocial.backend.marketplace.dto.ListingRequest;
import com.plantsocial.backend.marketplace.dto.ListingResponse;
import com.plantsocial.backend.marketplace.dto.ProductPreviewDTO;
import com.plantsocial.backend.marketplace.service.MarketplaceService;
import com.plantsocial.backend.marketplace.service.ScraperService;
import com.plantsocial.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceService marketplaceService;
    private final ScraperService scraperService;
    private final com.plantsocial.backend.service.FileStorageService fileStorageService;
    private final SecurityUtils securityUtils;

    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        UUID userId = securityUtils.getCurrentUser().getId();
        String fileUrl = fileStorageService.storeFile(file, userId, "marketplace");
        return ResponseEntity.ok(fileUrl);
    }

    @PostMapping("/preview")
    public ResponseEntity<ProductPreviewDTO> previewListing(@RequestBody java.util.Map<String, String> payload) {
        String url = payload.get("url");
        if (url == null || url.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(scraperService.fetchMetaData(url));
    }

    @PostMapping("/listings")
    public ResponseEntity<ListingResponse> createListing(@Valid @RequestBody ListingRequest request) {
        return ResponseEntity.ok(marketplaceService.createListing(request, securityUtils.getCurrentUser().getEmail()));
    }

    @PostMapping("/listings/{id}/pay")
    public ResponseEntity<ListingResponse> processPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(marketplaceService.processPayment(id));
    }

    @GetMapping("/listings")
    public ResponseEntity<List<ListingResponse>> getAllActiveListings() {
        return ResponseEntity.ok(marketplaceService.getAllActiveListings());
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<ListingResponse>> getMyListings() {
        return ResponseEntity.ok(marketplaceService.getListingsByUser(securityUtils.getCurrentUser().getEmail()));
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<ListingResponse> getListingById(@PathVariable UUID id) {
        return ResponseEntity.ok(marketplaceService.getListingById(id));
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable UUID id) {
        marketplaceService.deleteListing(id, securityUtils.getCurrentUser().getEmail());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/listings/{id}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable UUID id,
            @Valid @RequestBody ListingRequest request) {
        return ResponseEntity.ok(marketplaceService.updateListing(id, request, securityUtils.getCurrentUser().getEmail()));
    }
}
