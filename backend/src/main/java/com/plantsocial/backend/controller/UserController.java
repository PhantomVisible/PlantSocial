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

    /**
     * Get a user's public profile
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long postCount = postRepository.countByAuthorId(id);

        UserProfileDTO dto = new UserProfileDTO(
                user.getId(),
                user.getFullName(),
                user.getBio(),
                user.getLocation(),
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
