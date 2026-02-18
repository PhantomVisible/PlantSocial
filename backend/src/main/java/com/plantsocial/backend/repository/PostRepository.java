package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p ORDER BY p.createdAt DESC")
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    long countByAuthorId(UUID authorId);

    Page<Post> findByPlantTagIgnoreCaseOrderByCreatedAtDesc(String plantTag, Pageable pageable);

    List<Post> findAllByPlantId(UUID plantId);

    @Query("SELECT p FROM Post p WHERE p.createdAt >= :startDate ORDER BY SIZE(p.likes) DESC")
    org.springframework.data.domain.Page<Post> findTrendingPosts(java.time.LocalDateTime startDate, Pageable pageable);

    Page<Post> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String content, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Post p WHERE p.author.id = :authorId AND p.repostOf.id = :repostOfId")
    boolean existsByAuthorIdAndRepostOfId(@Param("authorId") UUID authorId, @Param("repostOfId") UUID repostOfId);

    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId AND p.repostOf.id = :repostOfId")
    Optional<Post> findByAuthorIdAndRepostOfId(@Param("authorId") UUID authorId, @Param("repostOfId") UUID repostOfId);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.repostOf.id = :repostOfId")
    long countByRepostOfId(@Param("repostOfId") UUID repostOfId);
}
