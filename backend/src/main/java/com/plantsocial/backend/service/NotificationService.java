package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.NotificationDTO;
import com.plantsocial.backend.model.Notification;
import com.plantsocial.backend.model.NotificationType;
import com.plantsocial.backend.repository.NotificationRepository;
import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createNotification(User recipient, User sender, NotificationType type, String content, UUID relatedId) {
        if (recipient.getId().equals(sender.getId()) && type != NotificationType.MESSAGE) {
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

    private void sendRealTimeNotification(Notification notification) {
        String destination = "/topic/notifications/" + notification.getRecipient().getId();
        messagingTemplate.convertAndSend(destination, mapToDTO(notification));
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
