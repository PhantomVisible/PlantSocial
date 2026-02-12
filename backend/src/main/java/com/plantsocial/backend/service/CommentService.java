package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.CommentRequest;
import com.plantsocial.backend.dto.CommentResponse;
import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.CommentRepository;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * Get top-level comments for a post (parentComment IS NULL)
     */
    public List<CommentResponse> getTopLevelComments(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        List<Comment> comments = commentRepository.findByPostAndParentCommentIsNullOrderByCreatedAtAsc(post);
        return comments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get replies to a specific comment
     */
    public List<CommentResponse> getReplies(UUID commentId) {
        Comment parent = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        List<Comment> replies = commentRepository.findByParentCommentOrderByCreatedAtAsc(parent);
        return replies.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Add a top-level comment to a post
     */
    @Transactional
    public CommentResponse addComment(UUID postId, CommentRequest request) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.content())
                .post(post)
                .author(user)
                .parentComment(null)
                .build();
        Comment saved = commentRepository.save(comment);
        return mapToResponse(saved);
    }

    /**
     * Reply to a specific comment
     */
    @Transactional
    public CommentResponse addReply(UUID parentCommentId, CommentRequest request) {
        User user = getCurrentUser();
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        Comment reply = Comment.builder()
                .content(request.content())
                .post(parent.getPost())
                .author(user)
                .parentComment(parent)
                .build();
        Comment saved = commentRepository.save(reply);
        return mapToResponse(saved);
    }

    /**
     * Get total comment count for a post
     */
    public long getCommentCount(Post post) {
        return commentRepository.countByPost(post);
    }

    private CommentResponse mapToResponse(Comment comment) {
        long replyCount = commentRepository.countByParentComment(comment);
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getId(),
                comment.getCreatedAt(),
                replyCount);
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
