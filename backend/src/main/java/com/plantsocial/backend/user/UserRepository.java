package com.plantsocial.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    Optional<User> findByResetPasswordToken(String token);

    @Query("""
                SELECT u FROM User u
                WHERE (LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')))
                AND u.id <> :excludeId
            """)
    List<User> searchByUsernameOrFullName(@Param("q") String q, @Param("excludeId") UUID excludeId);

    @Query("""
                SELECT u FROM User u
                WHERE u.id <> :currentUserId
                AND u.id NOT IN (
                    SELECT f.id FROM User me JOIN me.following f WHERE me.id = :currentUserId
                )
                ORDER BY SIZE(u.followers) DESC
            """)
    List<User> findSuggestedUsers(@Param("currentUserId") UUID currentUserId,
            org.springframework.data.domain.Pageable pageable);
}
