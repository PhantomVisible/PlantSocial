package com.plantsocial.backend.chat.model;

import com.plantsocial.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_room_members", uniqueConstraints = @UniqueConstraint(columnNames = { "chat_room_id", "user_id" }))
@EntityListeners(AuditingEntityListener.class)
public class ChatRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private MemberRole role = MemberRole.MEMBER;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    public enum MemberRole {
        OWNER, MEMBER
    }
}
