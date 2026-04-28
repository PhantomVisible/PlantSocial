package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.dto.UserProfileDTO;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.security.SecurityUtils;
import com.plantsocial.backend.service.FeedService;
import com.plantsocial.backend.user.SubscriptionTier;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FeedService feedService;
    private final com.plantsocial.backend.service.FileStorageService fileStorageService;
    private final SecurityUtils securityUtils;

    /**
     * Get a user's public profile
     */
    @GetMapping("/users/{username}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable String username) {
        User user = null;

        // 1. Try finding by username
        user = userRepository.findByUsername(username).orElse(null);

        // 2. If not found, and it looks like a UUID, try finding by ID
        if (user == null) {
            try {
                UUID userId = UUID.fromString(username);
                user = userRepository.findById(userId).orElse(null);
            } catch (IllegalArgumentException e) {
                // Not a UUID, ignore
            }
        }

        // 3. If still not found, return 404
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        long postCount = postRepository.countByAuthorId(user.getId());
        long followerCount = user.getFollowers().size();
        long followingCount = user.getFollowing().size();

        boolean isFollowing = false;
        User currentUser = getCurrentUserSafe(); // Need safe method or try/catch for auth check
        if (currentUser != null && !currentUser.getId().equals(user.getId())) {
            isFollowing = user.getFollowers().stream()
                    .anyMatch(f -> f.getId().equals(currentUser.getId()));
        }

        UserProfileDTO dto = new UserProfileDTO(
                user.getId(),
                user.getFullName(),
                user.getHandle(),
                user.getBio(),
                user.getLocation(),
                user.getProfilePictureUrl(),
                user.getCoverPictureUrl(),
                user.getCreatedAt(),
                postCount,
                followerCount,
                followingCount,
                isFollowing,
                user.getSubscriptionTier());
        return ResponseEntity.ok(dto);
    }

    /**
     * Get user follow suggestions (users not followed by current user, sorted by
     * follower count)
     */
    @GetMapping("/users/suggestions")
    public ResponseEntity<List<UserProfileDTO>> getSuggestions() {
        User currentUser = securityUtils.getCurrentUser();
        List<User> suggestions = userRepository.findSuggestedUsers(
                currentUser.getId(),
                PageRequest.of(0, 3));

        List<UserProfileDTO> result = suggestions.stream().map(u -> new UserProfileDTO(
                u.getId(),
                u.getFullName(),
                u.getHandle(),
                u.getBio(),
                u.getLocation(),
                u.getProfilePictureUrl(),
                u.getCoverPictureUrl(),
                u.getCreatedAt(),
                postRepository.countByAuthorId(u.getId()),
                (long) u.getFollowers().size(),
                (long) u.getFollowing().size(),
                false, // current user doesn't follow them (that's the point)
                u.getSubscriptionTier()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Get mutual connections (users who follow the current user and whom the
     * current user follows back)
     */
    @GetMapping("/users/{userId}/mutuals")
    public ResponseEntity<List<UserProfileDTO>> getMutualConnections(@PathVariable UUID userId) {
        // optionally verify if current user is requesting their own mutuals or not

        List<User> mutuals = userRepository.findMutualFollowers(userId);

        List<UserProfileDTO> result = mutuals.stream().map(u -> new UserProfileDTO(
                u.getId(),
                u.getFullName(),
                u.getHandle(),
                u.getBio(),
                u.getLocation(),
                u.getProfilePictureUrl(),
                u.getCoverPictureUrl(),
                u.getCreatedAt(),
                postRepository.countByAuthorId(u.getId()),
                (long) u.getFollowers().size(),
                (long) u.getFollowing().size(),
                true, // Since they are mutuals, the current user MUST be following them
                u.getSubscriptionTier()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Get all posts by a specific user (newest first)
     */
    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable UUID userId) {
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        User currentUser = getCurrentUserSafe(); // Using safe method to avoid crashing if viewed while unauthenticated,
                                                 // though typically won't hit here due to feedService mapping requiring
                                                 // a User mostly. Actually, better use safe.

        List<PostResponse> responses = posts.stream()
                .map(post -> feedService.mapToPostResponsePublic(post, currentUser))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Update user profile (avatar, cover, username, fullName, bio, location).
     * Accepts multipart/form-data with a JSON "data" part and optional image parts.
     */
    @PutMapping(value = "/users/profile", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestPart("data") com.plantsocial.backend.dto.UpdateProfileRequest request,
            @RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestPart(value = "coverImage", required = false) org.springframework.web.multipart.MultipartFile coverImage) {

        User currentUser = securityUtils.getCurrentUser();

        // 1. Validate and update username
        if (!currentUser.getHandle().equals(request.username())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new IllegalArgumentException("Username already taken");
            }
            currentUser.setUsername(request.username());
        }

        // 2. Update text fields
        currentUser.setFullName(request.fullName());
        currentUser.setBio(request.bio());
        if (request.location() != null) {
            currentUser.setLocation(request.location());
        }

        // 3. Handle image uploads — delegate to the active FileStorageService (S3)
        if (image != null && !image.isEmpty()) {
            currentUser.setProfilePictureUrl(fileStorageService.storeFile(image, currentUser.getId(), "profile"));
        }
        if (coverImage != null && !coverImage.isEmpty()) {
            currentUser.setCoverPictureUrl(fileStorageService.storeFile(coverImage, currentUser.getId(), "cover"));
        }

        userRepository.save(currentUser);

        long postCount = postRepository.countByAuthorId(currentUser.getId());
        long followerCount = currentUser.getFollowers().size();
        long followingCount = currentUser.getFollowing().size();

        return ResponseEntity.ok(new UserProfileDTO(
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getHandle(),
                currentUser.getBio(),
                currentUser.getLocation(),
                currentUser.getProfilePictureUrl(),
                currentUser.getCoverPictureUrl(),
                currentUser.getCreatedAt(),
                postCount,
                followerCount,
                followingCount,
                false,
                currentUser.getSubscriptionTier()));
    }

    @PostMapping("/users/me/upgrade-test")
    public ResponseEntity<Void> upgradeToProTest() {
        User currentUser = securityUtils.getCurrentUser();
        currentUser.setSubscriptionTier(SubscriptionTier.PRO);
        userRepository.save(currentUser);
        return ResponseEntity.ok().build();
    }

    private User getCurrentUserSafe() {
        return securityUtils.getCurrentUserOrNull();
    }
}
