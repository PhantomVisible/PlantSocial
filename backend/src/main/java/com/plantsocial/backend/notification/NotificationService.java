package com.plantsocial.backend.notification;

import com.plantsocial.backend.notification.dto.NotificationDTO;
import com.plantsocial.backend.notification.model.Notification;
import com.plantsocial.backend.notification.model.NotificationType;
import com.plantsocial.backend.notification.repository.NotificationRepository;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createNotification(User recipient, User sender, NotificationType type, String content, UUID relatedId) {
        // Log entry
        log.info("Creating notification type={} for user={}", type, recipient.getUsername());

        if (sender != null && recipient.getId().equals(sender.getId()) && type != NotificationType.MESSAGE) {
            log.debug("Blocked self-notification");
            return; // Don't notify self for likes/comments
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        sendRealTimeNotification(saved);
    }

    public Page<NotificationDTO> getNotifications(User user, Pageable pageable) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToDTO);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markRoomNotificationsRead(UUID roomId, User user) {
        notificationRepository.markRoomMessagesRead(user.getId(), roomId);
    }

    private void sendRealTimeNotification(Notification notification) {
        try {
            String destination = "/topic/notifications/" + notification.getRecipient().getId();
            log.info("Sending WebSocket notification to {}", destination);
            messagingTemplate.convertAndSend(destination, mapToDTO(notification));
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification: {}", e.getMessage(), e);
        }
    }

    private NotificationDTO mapToDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .content(n.getContent())
                .senderName(n.getSender() != null ? n.getSender().getFullName() : "System")
                .senderHandle(n.getSender() != null ? n.getSender().getHandle() : "system")
                .senderProfilePicture(n.getSender() != null ? n.getSender().getProfilePictureUrl() : null)
                .relatedId(n.getRelatedId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
