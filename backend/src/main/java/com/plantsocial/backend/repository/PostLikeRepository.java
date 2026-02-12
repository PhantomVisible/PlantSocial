package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.model.PostLike;
import com.plantsocial.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
    boolean existsByPostAndUser(Post post, User user);

    void deleteByPostAndUser(Post post, User user); // Note: Make sure to handle transaction for delete

    long countByPost(Post post);

    void deleteAllByPost(Post post);
}
