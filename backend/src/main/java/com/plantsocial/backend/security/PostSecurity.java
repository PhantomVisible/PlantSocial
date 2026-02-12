package com.plantsocial.backend.security;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("postSecurity")
@RequiredArgsConstructor
public class PostSecurity {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public boolean isOwner(Authentication authentication, UUID postId) {
        String email = extractEmail(authentication);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return false;

        Post post = postRepository.findById(postId).orElse(null);
        if (post == null)
            return false;

        return post.getAuthor().getId().equals(user.getId());
    }

    private String extractEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}
