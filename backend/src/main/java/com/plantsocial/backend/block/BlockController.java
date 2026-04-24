package com.plantsocial.backend.block;

import com.plantsocial.backend.security.SecurityUtils;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/block")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @PostMapping("/{userId}")
    public ResponseEntity<Void> blockUser(@PathVariable UUID userId) {
        User blocker = securityUtils.getCurrentUser();
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        blockService.blockUser(blocker, blocked);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unblockUser(@PathVariable UUID userId) {
        User blocker = securityUtils.getCurrentUser();
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        blockService.unblockUser(blocker, blocked);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/status")
    public ResponseEntity<Map<String, Boolean>> isBlocked(@PathVariable UUID userId) {
        User blocker = securityUtils.getCurrentUser();
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        boolean isBlocked = blockService.isBlocked(blocker, blocked);
        return ResponseEntity.ok(Map.of("blocked", isBlocked));
    }
}
