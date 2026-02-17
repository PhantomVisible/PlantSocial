package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.UserHoverCardDTO;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserHoverCardDTO getHoverCard(String username) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        User currentUser = getCurrentUser();

        return buildHoverCard(targetUser, currentUser);
    }

    @Transactional(readOnly = true)
    public UserHoverCardDTO getHoverCardById(UUID userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User currentUser = getCurrentUser();

        return buildHoverCard(targetUser, currentUser);
    }

    @Transactional
    public UserHoverCardDTO followUser(UUID userId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        if (!currentUser.getFollowing().contains(targetUser)) {
            currentUser.getFollowing().add(targetUser);
            userRepository.save(currentUser);
        }

        return buildHoverCard(targetUser, currentUser);
    }

    @Transactional
    public UserHoverCardDTO unfollowUser(UUID userId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (currentUser.getFollowing().contains(targetUser)) {
            currentUser.getFollowing().remove(targetUser);
            userRepository.save(currentUser);
        }

        return buildHoverCard(targetUser, currentUser);
    }

    private UserHoverCardDTO buildHoverCard(User targetUser, User currentUser) {
        long followerCount = targetUser.getFollowers().size();
        long followingCount = targetUser.getFollowing().size();

        boolean isFollowing = false;
        if (currentUser != null && !currentUser.getId().equals(targetUser.getId())) {
            isFollowing = targetUser.getFollowers().stream()
                    .anyMatch(follower -> follower.getId().equals(currentUser.getId()));
        }

        return UserHoverCardDTO.builder()
                .id(targetUser.getId())
                .fullName(targetUser.getFullName())
                .username(targetUser.getUsername())
                .bio(targetUser.getBio())
                .profilePictureUrl(targetUser.getProfilePictureUrl())
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isFollowing(isFollowing)
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElse(null);
    }
}
