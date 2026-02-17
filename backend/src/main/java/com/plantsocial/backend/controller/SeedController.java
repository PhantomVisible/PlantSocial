package com.plantsocial.backend.controller;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.Role;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seed")
@RequiredArgsConstructor
public class SeedController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public String seedData() {
        // 1. Ensure Users Exist
        User alice = userRepository.findByUsername("alice").orElse(null);
        if (alice == null) {
            alice = User.builder()
                    .fullName("Alice Green")
                    .username("alice")
                    .email("alice@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.USER)
                    .bio("I love ferns!")
                    .location("Seattle, WA")
                    .build();
            alice = userRepository.save(alice);
        }

        User bob = userRepository.findByUsername("bob").orElse(null);
        if (bob == null) {
            bob = User.builder()
                    .fullName("Bob Planter")
                    .username("bob")
                    .email("bob@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.USER)
                    .bio("Succulent enthusiast.")
                    .location("Austin, TX")
                    .build();
            bob = userRepository.save(bob);
        }

        // 2. Ensure Posts Exist
        if (postRepository.count() == 0) {
            Post p1 = Post.builder()
                    .content("Just bought a new Monstera! It's huge! 🌿")
                    .author(alice)
                    .plantTag("Monstera")
                    .build();

            Post p2 = Post.builder()
                    .content("Does anyone know how often to water a Snake Plant? 🤔")
                    .author(alice)
                    .plantTag("Snake Plant")
                    .build();

            Post p3 = Post.builder()
                    .content("Look at my cactus blooming! 🌵🌸")
                    .author(bob)
                    .plantTag("Cactus")
                    .build();

            postRepository.saveAll(List.of(p1, p2, p3));
            return "Created 3 initial posts for Alice and Bob.";
        } else {
            return "Posts already exist. Skipping seed.";
        }
    }
}
