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

        UserProfileDTO dto = new UserProfileDTO(
                user.getId(),
                user.getFullName(),
                user.getHandle(),
                user.getBio(),
                user.getLocation(),
                user.getProfilePictureUrl(),
                user.getCreatedAt(),
                postCount);
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
            @RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {

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

        // 3. Handle Image Upload
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            currentUser.setProfilePictureUrl(imageUrl);
        }

        userRepository.save(currentUser);

        long postCount = postRepository.countByAuthorId(currentUser.getId());
        UserProfileDTO dto = new UserProfileDTO(
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getHandle(),
                currentUser.getBio(),
                currentUser.getLocation(),
                currentUser.getProfilePictureUrl(),
                currentUser.getCreatedAt(),
                postCount);

        return ResponseEntity.ok(dto);
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
