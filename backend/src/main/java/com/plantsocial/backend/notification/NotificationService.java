package com.plantsocial.backend.notification;

import com.plantsocial.backend.notification.dto.NotificationDTO;
import com.plantsocial.backend.notification.model.Notification;
import com.plantsocial.backend.notification.model.NotificationType;
import com.plantsocial.backend.notification.repository.NotificationRepository;
import com.plantsocial.backend.realtime.CentrifugoPublisherService;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CentrifugoPublisherService centrifugoPublisher;

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
        int updated = notificationRepository.markRoomMessagesRead(user.getId(), roomId);
        log.info("Marked {} notifications as read for room {} / user {}", updated, roomId, user.getId());
    }

    private void sendRealTimeNotification(Notification notification) {
        String channel = "/topic/notifications/" + notification.getRecipient().getId();
        log.info("Publishing real-time notification to Centrifugo channel {}", channel);
        centrifugoPublisher.publish(channel, mapToDTO(notification));
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
