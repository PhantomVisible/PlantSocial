package com.plantsocial.backend.chat;

import com.plantsocial.backend.chat.dto.ChatMessageDTO;
import com.plantsocial.backend.chat.dto.ChatRoomDTO;
import com.plantsocial.backend.chat.dto.CreateRoomRequest;
import com.plantsocial.backend.chat.model.ChatMessage;
import com.plantsocial.backend.chat.model.ChatRoom;
import com.plantsocial.backend.chat.model.ChatRoomMember;
import com.plantsocial.backend.chat.repository.ChatMessageRepository;
import com.plantsocial.backend.chat.repository.ChatRoomMemberRepository;
import com.plantsocial.backend.chat.repository.ChatRoomRepository;
import com.plantsocial.backend.exception.BusinessException;
import com.plantsocial.backend.notification.NotificationService;
import com.plantsocial.backend.notification.model.NotificationType;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    // ─── Room Management ───────────────────────────────────────────

    @Transactional
    public ChatRoomDTO createGroupRoom(CreateRoomRequest request, User creator) {
        ChatRoom room = ChatRoom.builder()
                .name(request.name())
                .type(ChatRoom.ChatRoomType.GROUP)
                .createdBy(creator)
                .build();
        chatRoomRepository.save(room);

        // Add creator as OWNER
        addMember(room, creator, ChatRoomMember.MemberRole.OWNER);

        // Add invited members
        if (request.memberIds() != null) {
            for (UUID memberId : request.memberIds()) {
                userRepository.findById(memberId)
                        .ifPresent(user -> addMember(room, user, ChatRoomMember.MemberRole.MEMBER));
            }
        }

        log.info("Group room '{}' created by user '{}'", room.getName(), creator.getUsername());
        return mapToRoomDTO(room);
    }

    @Transactional
    public ChatRoomDTO getOrCreatePrivateRoom(User currentUser, UUID otherUserId) {
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new BusinessException(BusinessException.USER_NOT_FOUND, "User not found"));

        // Check if private room already exists
        return chatRoomRepository.findPrivateRoom(currentUser.getId(), otherUserId)
                .map(this::mapToRoomDTO)
                .orElseGet(() -> {
                    ChatRoom room = ChatRoom.builder()
                            .type(ChatRoom.ChatRoomType.PRIVATE)
                            .createdBy(currentUser)
                            .build();
                    chatRoomRepository.save(room);
                    addMember(room, currentUser, ChatRoomMember.MemberRole.MEMBER);
                    addMember(room, otherUser, ChatRoomMember.MemberRole.MEMBER);
                    log.info("Private room created between '{}' and '{}'",
                            currentUser.getUsername(), otherUser.getUsername());
                    return mapToRoomDTO(room);
                });
    }

    public List<ChatRoomDTO> getUserRooms(User user) {
        return chatRoomRepository.findRoomsByUserId(user.getId())
                .stream()
                .map(this::mapToRoomDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMemberToRoom(UUID roomId, UUID userId, User requester) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("ROOM_NOT_FOUND", "Chat room not found"));

        if (room.getType() == ChatRoom.ChatRoomType.PRIVATE) {
            throw new BusinessException("INVALID_OPERATION", "Cannot add members to a private chat");
        }

        // Verify requester is a member
        if (!chatRoomMemberRepository.existsByChatRoomIdAndUserId(roomId, requester.getId())) {
            throw new BusinessException("NOT_A_MEMBER", "You are not a member of this room");
        }

        User newMember = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(BusinessException.USER_NOT_FOUND, "User not found"));

        if (chatRoomMemberRepository.existsByChatRoomIdAndUserId(roomId, userId)) {
            throw new BusinessException("ALREADY_MEMBER", "User is already a member");
        }

        addMember(room, newMember, ChatRoomMember.MemberRole.MEMBER);
    }

    @Transactional
    public void removeMemberFromRoom(UUID roomId, UUID userId, User requester) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("ROOM_NOT_FOUND", "Chat room not found"));

        if (room.getType() == ChatRoom.ChatRoomType.PRIVATE) {
            throw new BusinessException("INVALID_OPERATION", "Cannot remove members from a private chat");
        }

        chatRoomMemberRepository.deleteByChatRoomIdAndUserId(roomId, userId);
    }

    // ─── Messages ──────────────────────────────────────────────────

    @Transactional
    public ChatMessageDTO sendMessage(UUID roomId, User sender, String content, String messageType, String mediaUrl) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("ROOM_NOT_FOUND", "Chat room not found"));

        // Verify sender is a member
        if (!chatRoomMemberRepository.existsByChatRoomIdAndUserId(roomId, sender.getId())) {
            throw new BusinessException("NOT_A_MEMBER", "You are not a member of this room");
        }

        ChatMessage.MessageType type = ChatMessage.MessageType.TEXT;
        if (messageType != null) {
            try {
                type = ChatMessage.MessageType.valueOf(messageType.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // default to TEXT
            }
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .sender(sender)
                .content(content)
                .messageType(type)
                .mediaUrl(mediaUrl)
                .build();
        chatMessageRepository.save(message);

        ChatMessageDTO dto = mapToMessageDTO(message);

        // Send real-time message to room topic
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);

        // Send notifications to other members
        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoomId(roomId);
        members.stream()
                .filter(m -> !m.getUser().getId().equals(sender.getId()))
                .forEach(m -> {
                    notificationService.createNotification(
                            m.getUser(),
                            sender,
                            NotificationType.MESSAGE,
                            "New message from " + sender.getFullName(),
                            roomId);
                });

        return dto;
    }

    public Page<ChatMessageDTO> getMessages(UUID roomId, int page, int size) {
        return chatMessageRepository
                .findByChatRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(page, size))
                .map(this::mapToMessageDTO);
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private void addMember(ChatRoom room, User user, ChatRoomMember.MemberRole role) {
        ChatRoomMember member = ChatRoomMember.builder()
                .chatRoom(room)
                .user(user)
                .role(role)
                .build();
        chatRoomMemberRepository.save(member);
    }

    public ChatRoomDTO mapToRoomDTO(ChatRoom room) {
        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoomId(room.getId());
        List<ChatRoomDTO.MemberInfo> memberInfos = members.stream()
                .map(m -> new ChatRoomDTO.MemberInfo(
                        m.getUser().getId(),
                        m.getUser().getUsername(),
                        m.getUser().getFullName(),
                        m.getUser().getProfilePictureUrl(),
                        m.getRole().name()))
                .collect(Collectors.toList());

        ChatMessageDTO lastMessage = chatMessageRepository
                .findTopByChatRoomIdOrderByCreatedAtDesc(room.getId())
                .map(this::mapToMessageDTO)
                .orElse(null);

        return new ChatRoomDTO(
                room.getId(),
                room.getName(),
                room.getType().name(),
                memberInfos,
                lastMessage,
                room.getCreatedAt());
    }

    private ChatMessageDTO mapToMessageDTO(ChatMessage msg) {
        return new ChatMessageDTO(
                msg.getId(),
                msg.getChatRoom().getId(),
                msg.getSender().getId(),
                msg.getSender().getUsername(),
                msg.getSender().getFullName(),
                msg.getSender().getProfilePictureUrl(),
                msg.getContent(),
                msg.getMessageType().name(),
                msg.getMediaUrl(),
                msg.getCreatedAt());
    }

    // ─── User Search ────────────────────────────────────────────────

    public List<User> searchUsers(String query, UUID excludeUserId) {
        return userRepository.searchByUsernameOrFullName(query, excludeUserId);
    }

    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
