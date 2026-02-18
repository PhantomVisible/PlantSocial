package com.plantsocial.backend.notification;

import com.plantsocial.backend.notification.dto.NotificationDTO;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationRestController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public Page<NotificationDTO> getNotifications(Authentication authentication, Pageable pageable) {
        User user = getUser(authentication);
        return notificationService.getNotifications(user, pageable);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(Authentication authentication) {
        User user = getUser(authentication);
        return notificationService.getUnreadCount(user);
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
