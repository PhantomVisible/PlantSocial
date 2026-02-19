package com.plantsocial.backend.block;

import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/block")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;
    private final UserRepository userRepository;

    @PostMapping("/{userId}")
    public ResponseEntity<Void> blockUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User blocker = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        blockService.blockUser(blocker, blocked);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unblockUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User blocker = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        blockService.unblockUser(blocker, blocked);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/status")
    public ResponseEntity<Map<String, Boolean>> isBlocked(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User blocker = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        boolean isBlocked = blockService.isBlocked(blocker, blocked);
        return ResponseEntity.ok(Map.of("blocked", isBlocked));
    }
}
