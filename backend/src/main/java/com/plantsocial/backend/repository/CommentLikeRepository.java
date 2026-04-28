package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.CommentLike;
import com.plantsocial.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    boolean existsByCommentAndUser(Comment comment, User user);
    void deleteByCommentAndUser(Comment comment, User user);
    long countByComment(Comment comment);
}
