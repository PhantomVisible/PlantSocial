package com.plantsocial.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    /**
     * Native INSERT used by JwtUserSyncFilter to provision Keycloak users on first
     * login. Uses persist() semantics (not merge()) by bypassing Spring Data's
     * isNew() check. ON CONFLICT DO NOTHING handles concurrent provisioning.
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = """
            INSERT INTO users (id, full_name, email, password, role, username, enabled, created_at)
            VALUES (:id, :fullName, :email, 'OIDC_MANAGED', 'USER', :username, true, NOW())
            ON CONFLICT DO NOTHING
            """, nativeQuery = true)
    int provisionFromJwt(
            @Param("id") UUID id,
            @Param("fullName") String fullName,
            @Param("email") String email,
            @Param("username") String username);

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

    @Query("""
                SELECT u FROM User u
                WHERE u.id IN (
                    SELECT f.id FROM User me JOIN me.following f WHERE me.id = :userId
                )
                AND u.id IN (
                    SELECT f.id FROM User me JOIN me.followers f WHERE me.id = :userId
                )
            """)
    List<User> findMutualFollowers(@Param("userId") UUID userId);
}
