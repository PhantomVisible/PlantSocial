package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.CommentRequest;
import com.plantsocial.backend.dto.CommentResponse;
import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.CommentLike;
import com.plantsocial.backend.model.CommentReport;
import com.plantsocial.backend.notification.model.NotificationType;
import com.plantsocial.backend.notification.NotificationService;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.CommentLikeRepository;
import com.plantsocial.backend.repository.CommentRepository;
import com.plantsocial.backend.repository.CommentReportRepository;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.security.SecurityUtils;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
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
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;
    private final CommentLikeRepository commentLikeRepository;
    private final CommentReportRepository commentReportRepository;

    public List<CommentResponse> getTopLevelComments(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User viewer = securityUtils.getCurrentUserOrNull();
        return commentRepository.findByPostAndParentCommentIsNullOrderByCreatedAtAsc(post)
                .stream().map(c -> mapToResponse(c, viewer)).collect(Collectors.toList());
    }

    public List<CommentResponse> getReplies(UUID commentId) {
        Comment parent = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        User viewer = securityUtils.getCurrentUserOrNull();
        return commentRepository.findByParentCommentOrderByCreatedAtAsc(parent)
                .stream().map(c -> mapToResponse(c, viewer)).collect(Collectors.toList());
    }

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

        notificationService.createNotification(
                post.getAuthor(),
                user,
                NotificationType.COMMENT,
                user.getFullName() + " commented on your post",
                post.getId());

        return mapToResponse(saved, user);
    }

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

        notificationService.createNotification(
                parent.getAuthor(),
                user,
                NotificationType.COMMENT,
                user.getFullName() + " replied to your comment",
                parent.getPost().getId());

        return mapToResponse(saved, user);
    }

    @Transactional
    public CommentResponse likeComment(UUID commentId) {
        User user = getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!commentLikeRepository.existsByCommentAndUser(comment, user)) {
            commentLikeRepository.save(CommentLike.builder().comment(comment).user(user).build());
        }
        return mapToResponse(comment, user);
    }

    @Transactional
    public CommentResponse unlikeComment(UUID commentId) {
        User user = getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        commentLikeRepository.deleteByCommentAndUser(comment, user);
        return mapToResponse(comment, user);
    }

    @Transactional
    public void reportComment(UUID commentId, String reason) {
        User reporter = getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (commentReportRepository.existsByReporterIdAndCommentId(reporter.getId(), commentId)) {
            throw new IllegalArgumentException("You have already reported this comment");
        }

        commentReportRepository.save(CommentReport.builder()
                .reporter(reporter)
                .comment(comment)
                .reason(reason)
                .build());
    }

    public long getCommentCount(Post post) {
        return commentRepository.countByPost(post);
    }

    private CommentResponse mapToResponse(Comment comment, User viewer) {
        long replyCount = commentRepository.countByParentComment(comment);
        long likeCount = commentLikeRepository.countByComment(comment);
        boolean liked = viewer != null && commentLikeRepository.existsByCommentAndUser(comment, viewer);
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getId(),
                comment.getCreatedAt(),
                replyCount,
                comment.getAuthor().getProfilePictureUrl(),
                comment.getAuthor().getSubscriptionTier() != null ? comment.getAuthor().getSubscriptionTier().name() : null,
                likeCount,
                liked);
    }

    private User getCurrentUser() {
        return securityUtils.getCurrentUser();
    }
}
