package com.plantsocial.backend.security;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("postSecurity")
@RequiredArgsConstructor
public class PostSecurity {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public boolean isOwner(Authentication authentication, UUID postId) {
        User user = securityUtils.getCurrentUserOrNull();
        if (user == null) return false;

        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) return false;

        return post.getAuthor().getId().equals(user.getId());
    }
}
