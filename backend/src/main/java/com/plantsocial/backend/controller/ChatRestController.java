package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.ChatMessageDTO;
import com.plantsocial.backend.dto.ChatRoomDTO;
import com.plantsocial.backend.dto.CreateRoomRequest;
import com.plantsocial.backend.service.ChatService;
import com.plantsocial.backend.service.PresenceService;
import com.plantsocial.backend.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final PresenceService presenceService;

    // ─── Rooms ─────────────────────────────────────────────────────

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomDTO> createGroupRoom(@Valid @RequestBody CreateRoomRequest request) {
        User currentUser = chatService.getCurrentUser();
        return ResponseEntity.ok(chatService.createGroupRoom(request, currentUser));
    }

    @PostMapping("/rooms/private/{userId}")
    public ResponseEntity<ChatRoomDTO> getOrCreatePrivateRoom(@PathVariable UUID userId) {
        User currentUser = chatService.getCurrentUser();
        return ResponseEntity.ok(chatService.getOrCreatePrivateRoom(currentUser, userId));
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDTO>> getUserRooms() {
        User currentUser = chatService.getCurrentUser();
        return ResponseEntity.ok(chatService.getUserRooms(currentUser));
    }

    // ─── Messages ──────────────────────────────────────────────────

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Page<ChatMessageDTO>> getMessages(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessages(roomId, page, size));
    }

    // ─── Members ───────────────────────────────────────────────────

    @PostMapping("/rooms/{roomId}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID roomId,
            @RequestBody UUID userId) {
        User currentUser = chatService.getCurrentUser();
        chatService.addMemberToRoom(roomId, userId, currentUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID roomId,
            @PathVariable UUID userId) {
        User currentUser = chatService.getCurrentUser();
        chatService.removeMemberFromRoom(roomId, userId, currentUser);
        return ResponseEntity.ok().build();
    }

    // ─── Media Upload ──────────────────────────────────────────────

    @PostMapping(value = "/rooms/{roomId}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageDTO> uploadMedia(
            @PathVariable UUID roomId,
            @RequestParam("file") MultipartFile file) throws IOException {

        User currentUser = chatService.getCurrentUser();

        // Save file
        // Save file
        String uploadDir = "uploads/chat";
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        System.out.println("Uploading file to: " + uploadPath.toString());

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        String mediaUrl = "/images/chat/" + fileName;

        // Determine type
        String contentType = file.getContentType();
        String messageType = "FILE";
        if (contentType != null && contentType.startsWith("image/")) {
            messageType = "IMAGE";
        }

        ChatMessageDTO msg = chatService.sendMessage(
                roomId, currentUser, file.getOriginalFilename(), messageType, mediaUrl);

        return ResponseEntity.ok(msg);
    }

    // ─── Presence ──────────────────────────────────────────────────

    @GetMapping("/online")
    public ResponseEntity<List<PresenceService.OnlineUser>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }

    // ─── User Search (for creating private chats) ───────────────────

    @GetMapping("/users/search")
    public ResponseEntity<List<UserSearchResult>> searchUsers(@RequestParam String q) {
        User currentUser = chatService.getCurrentUser();
        return ResponseEntity.ok(
                chatService.searchUsers(q, currentUser.getId()).stream()
                        .map(u -> new UserSearchResult(
                                u.getId(), u.getUsername(), u.getFullName(),
                                presenceService.isOnline(u.getId().toString())))
                        .toList());
    }

    public record UserSearchResult(UUID id, String username, String fullName, boolean online) {
    }
}
