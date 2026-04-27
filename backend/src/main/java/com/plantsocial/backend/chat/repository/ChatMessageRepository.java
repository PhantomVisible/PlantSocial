package com.plantsocial.backend.chat.repository;

import com.plantsocial.backend.chat.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId, Pageable pageable);

    Optional<ChatMessage> findTopByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatMessage m SET m.isRead = true " +
           "WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead IS NOT TRUE")
    int markMessagesReadInRoom(@Param("roomId") UUID roomId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :roomId AND m.sender.id != :userId AND m.isRead IS NOT TRUE")
    long countUnreadMessages(@Param("roomId") UUID roomId, @Param("userId") UUID userId);
}
