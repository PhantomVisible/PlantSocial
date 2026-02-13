package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p ORDER BY p.createdAt DESC")
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    long countByAuthorId(UUID authorId);

    Page<Post> findByPlantTagIgnoreCaseOrderByCreatedAtDesc(String plantTag, Pageable pageable);
}
