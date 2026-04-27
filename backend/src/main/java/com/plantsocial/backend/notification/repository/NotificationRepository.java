package com.plantsocial.backend.notification.repository;

import com.plantsocial.backend.notification.model.Notification;
import com.plantsocial.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    long countByRecipientAndIsReadFalse(User recipient);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true " +
           "WHERE n.recipient.id = :userId AND n.relatedId = :roomId " +
           "AND n.type = com.plantsocial.backend.notification.model.NotificationType.MESSAGE " +
           "AND n.isRead = false")
    int markRoomMessagesRead(@Param("userId") UUID userId, @Param("roomId") UUID roomId);
}
