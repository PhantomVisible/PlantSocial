package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.UserHoverCardDTO;
import com.plantsocial.backend.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @GetMapping("/{username}/hover-card")
    public ResponseEntity<UserHoverCardDTO> getHoverCard(@PathVariable String username) {
        return ResponseEntity.ok(followService.getHoverCard(username));
    }

    @GetMapping("/id/{userId}/hover-card")
    public ResponseEntity<UserHoverCardDTO> getHoverCardById(@PathVariable UUID userId) {
        return ResponseEntity.ok(followService.getHoverCardById(userId));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<UserHoverCardDTO> followUser(@PathVariable UUID id) {
        return ResponseEntity.ok(followService.followUser(id));
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<UserHoverCardDTO> unfollowUser(@PathVariable UUID id) {
        return ResponseEntity.ok(followService.unfollowUser(id));
    }
}
