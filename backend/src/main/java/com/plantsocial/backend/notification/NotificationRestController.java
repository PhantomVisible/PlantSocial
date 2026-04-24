package com.plantsocial.backend.notification;

import com.plantsocial.backend.notification.dto.NotificationDTO;
import com.plantsocial.backend.security.SecurityUtils;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationRestController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @GetMapping
    public Page<NotificationDTO> getNotifications(Pageable pageable) {
        User user = securityUtils.getCurrentUser();
        return notificationService.getNotifications(user, pageable);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount() {
        User user = securityUtils.getCurrentUser();
        return notificationService.getUnreadCount(user);
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
    }

    @PostMapping("/system")
    public void createSystemNotification(@RequestBody Map<String, Object> payload) {
        UUID userId = UUID.fromString((String) payload.get("userId"));
        String content = (String) payload.get("content");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // System notifications have no sender (or we can pass a dummy 'system' user if
        // needed).
        notificationService.createNotification(user, null,
                com.plantsocial.backend.notification.model.NotificationType.MESSAGE, content, null);
    }

}
