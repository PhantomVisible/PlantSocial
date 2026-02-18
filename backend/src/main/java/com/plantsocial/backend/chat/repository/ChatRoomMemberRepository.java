package com.plantsocial.backend.chat.repository;

import com.plantsocial.backend.chat.model.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, UUID> {

    List<ChatRoomMember> findByChatRoomId(UUID chatRoomId);

    List<ChatRoomMember> findByUserId(UUID userId);

    Optional<ChatRoomMember> findByChatRoomIdAndUserId(UUID chatRoomId, UUID userId);

    boolean existsByChatRoomIdAndUserId(UUID chatRoomId, UUID userId);

    void deleteByChatRoomIdAndUserId(UUID chatRoomId, UUID userId);

    long countByChatRoomId(UUID chatRoomId);
}
