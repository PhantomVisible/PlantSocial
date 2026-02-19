package com.plantsocial.backend.block;

import com.plantsocial.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;
import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {
    boolean existsByBlockerAndBlocked(User blocker, User blocked);

    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :blockerId")
    Set<UUID> findBlockedUserIdsByBlockerId(@Param("blockerId") UUID blockerId);

    @Query("SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :blockedId")
    Set<UUID> findBlockerUserIdsByBlockedId(@Param("blockedId") UUID blockedId);

    @Modifying
    void deleteByBlockerAndBlocked(User blocker, User blocked);
}
