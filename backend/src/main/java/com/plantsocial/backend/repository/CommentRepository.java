package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // Top-level comments for a post (no parent)
    List<Comment> findByPostAndParentCommentIsNullOrderByCreatedAtAsc(Post post);

    // Replies to a specific comment
    List<Comment> findByParentCommentOrderByCreatedAtAsc(Comment parentComment);

    // Count replies for a specific comment
    long countByParentComment(Comment parentComment);

    // Count all comments on a post (for post-level comment count)
    long countByPost(Post post);

    // Legacy query kept for compatibility
    List<Comment> findByPostOrderByCreatedAtAsc(Post post);

    void deleteAllByPost(Post post);
}
