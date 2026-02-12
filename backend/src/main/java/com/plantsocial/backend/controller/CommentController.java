package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.CommentRequest;
import com.plantsocial.backend.dto.CommentResponse;
import com.plantsocial.backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * Get top-level comments for a post
     */
    @GetMapping("/feed/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable UUID postId) {
        return ResponseEntity.ok(commentService.getTopLevelComments(postId));
    }

    /**
     * Add a top-level comment to a post
     */
    @PostMapping("/feed/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(postId, request));
    }

    /**
     * Get replies to a specific comment
     */
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<CommentResponse>> getReplies(@PathVariable UUID commentId) {
        return ResponseEntity.ok(commentService.getReplies(commentId));
    }

    /**
     * Reply to a specific comment
     */
    @PostMapping("/comments/{commentId}/replies")
    public ResponseEntity<CommentResponse> addReply(
            @PathVariable UUID commentId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addReply(commentId, request));
    }
}
