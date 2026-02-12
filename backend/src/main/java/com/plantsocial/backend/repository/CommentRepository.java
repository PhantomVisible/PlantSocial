package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByPostOrderByCreatedAtAsc(Post post);

    void deleteAllByPost(Post post);
}
