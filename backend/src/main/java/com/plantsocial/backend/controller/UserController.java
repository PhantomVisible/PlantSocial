package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.dto.UserProfileDTO;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.service.FeedService;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * Get a user's public profile
     */
    @GetMapping("/users/{username}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

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
                isFollowing);
        return ResponseEntity.ok(dto);
    }

    /**
     * Get all posts by a specific user (newest first)
     */
    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable UUID userId) {
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        User currentUser = getCurrentUser();

        List<PostResponse> responses = posts.stream()
                .map(post -> feedService.mapToPostResponsePublic(post, currentUser))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Update user profile
     */
    @PutMapping(value = "/users/profile", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestPart("data") com.plantsocial.backend.dto.UpdateProfileRequest request,
            @RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestPart(value = "coverImage", required = false) org.springframework.web.multipart.MultipartFile coverImage) {

        User currentUser = getCurrentUser();

        // 1. Validate Username
        if (!currentUser.getHandle().equals(request.username())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new IllegalArgumentException("Username already taken");
            }
            currentUser.setUsername(request.username());
        }

        // 2. Update Text Fields
        currentUser.setFullName(request.fullName());
        currentUser.setBio(request.bio());

        // 3. Handle Image Uploads
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            currentUser.setProfilePictureUrl(imageUrl);
        }

        if (coverImage != null && !coverImage.isEmpty()) {
            String coverUrl = fileStorageService.storeFile(coverImage);
            currentUser.setCoverPictureUrl(coverUrl);
        }

        userRepository.save(currentUser);

        long postCount = postRepository.countByAuthorId(currentUser.getId());
        long followerCount = currentUser.getFollowers().size();
        long followingCount = currentUser.getFollowing().size();
        // User cannot follow themselves, so isFollowing is false

        UserProfileDTO dto = new UserProfileDTO(
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
                false);

        return ResponseEntity.ok(dto);
    }

    private User getCurrentUserSafe() {
        try {
            return getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
