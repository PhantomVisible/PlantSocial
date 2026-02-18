package com.plantsocial.backend.controller;

import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(
            Pageable pageable,
            @RequestParam(value = "plant", required = false) String plant,
            @RequestParam(value = "q", required = false) String query) {
        try {
            return ResponseEntity.ok(feedService.getFeed(pageable, plant, query));
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestParam("caption") String caption,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "plantId", required = false) UUID plantId,
            @RequestParam(value = "plantTag", required = false) String plantTag) {
        return ResponseEntity.ok(feedService.createPost(caption, file, plantId, plantTag));
    }

    @PutMapping("/{postId}")
    @PreAuthorize("@postSecurity.isOwner(authentication, #postId)")
    public ResponseEntity<PostResponse> editPost(
            @PathVariable UUID postId,
            @RequestParam("caption") String caption,
            @RequestParam(value = "plantTag", required = false) String plantTag) {
        return ResponseEntity.ok(feedService.editPost(postId, caption, plantTag));
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("@postSecurity.isOwner(authentication, #postId)")
    public ResponseEntity<Void> deletePost(@PathVariable UUID postId) {
        feedService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> likePost(@PathVariable UUID postId) {
        feedService.likePost(postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/repost")
    public ResponseEntity<Void> repostPost(@PathVariable UUID postId) {
        feedService.repostPost(postId);
        return ResponseEntity.ok().build();
    }
}
