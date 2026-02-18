package com.plantsocial.backend.chat.repository;

import com.plantsocial.backend.chat.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Query("""
                SELECT DISTINCT cr FROM ChatRoom cr
                JOIN ChatRoomMember crm ON crm.chatRoom = cr
                WHERE crm.user.id = :userId
                ORDER BY cr.createdAt DESC
            """)
    List<ChatRoom> findRoomsByUserId(@Param("userId") UUID userId);

    @Query("""
                SELECT cr FROM ChatRoom cr
                WHERE cr.type = 'PRIVATE'
                AND cr.id IN (
                    SELECT crm1.chatRoom.id FROM ChatRoomMember crm1
                    WHERE crm1.user.id = :user1Id
                )
                AND cr.id IN (
                    SELECT crm2.chatRoom.id FROM ChatRoomMember crm2
                    WHERE crm2.user.id = :user2Id
                )
            """)
    Optional<ChatRoom> findPrivateRoom(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
}
