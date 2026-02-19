package com.plantsocial.backend.block;

import com.plantsocial.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlockService {

    private final UserBlockRepository userBlockRepository;

    @Transactional
    public void blockUser(User blocker, User blocked) {
        if (blocker.getId().equals(blocked.getId())) {
            throw new IllegalArgumentException("You cannot block yourself.");
        }
        if (userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)) {
            return; // Already blocked
        }
        UserBlock block = new UserBlock(blocker, blocked);
        userBlockRepository.save(block);
    }

    @Transactional
    public void unblockUser(User blocker, User blocked) {
        userBlockRepository.deleteByBlockerAndBlocked(blocker, blocked);
    }

    @Transactional(readOnly = true)
    public Set<UUID> getMutualBlockedUserIds(UUID userId) {
        Set<UUID> blockedIds = userBlockRepository.findBlockedUserIdsByBlockerId(userId);
        Set<UUID> blockerIds = userBlockRepository.findBlockerUserIdsByBlockedId(userId);

        Set<UUID> allBlocked = new HashSet<>();
        allBlocked.addAll(blockedIds);
        allBlocked.addAll(blockerIds);
        return allBlocked;
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(User blocker, User blocked) {
        return userBlockRepository.existsByBlockerAndBlocked(blocker, blocked);
    }
}
