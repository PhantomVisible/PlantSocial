package com.plantsocial.backend.chat.repository;

import com.plantsocial.backend.chat.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId, Pageable pageable);

    Optional<ChatMessage> findTopByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId);
}
