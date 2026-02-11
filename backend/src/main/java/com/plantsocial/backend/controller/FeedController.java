package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.CommentRequest;
import com.plantsocial.backend.dto.CreatePostRequest;
import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.service.FeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(Pageable pageable) {
        return ResponseEntity.ok(feedService.getFeed(pageable));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(feedService.createPost(request));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> likePost(@PathVariable UUID postId) {
        feedService.likePost(postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<Void> commentOnPost(
            @PathVariable UUID postId,
            @Valid @RequestBody CommentRequest request) {
        feedService.commentOnPost(postId, request);
        return ResponseEntity.ok().build();
    }
}
