package com.plantsocial.backend.config;

import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.Role;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Slf4j
@Component
@RequiredArgsConstructor
public class BackendSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final PostRepository postRepository;
        private final PasswordEncoder passwordEncoder;
        private final EntityManager entityManager;

        public static final UUID BACHIR_ID = UUID.fromString("c0a801fa-0000-0000-0000-000000000001");
        public static final UUID ALAE_ID = UUID.fromString("c0a801fa-0000-0000-0000-000000000002");
        public static final UUID PHANTOM_ID = UUID.fromString("c0a801fa-0000-0000-0000-000000000003");
        public static final UUID ALICE_ID = UUID.fromString("c0a801fa-0000-0000-0000-000000000004");
        public static final UUID BOB_ID = UUID.fromString("c0a801fa-0000-0000-0000-000000000005");

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                if (userRepository.count() > 0) {
                        log.info("Database already populated. Skipping backend seeder.");
                        return;
                }

                log.info("PlantSocial database is empty. Initiating Backend Seeder for Demo Day...");

                String defaultPassword = passwordEncoder.encode("demo123");

                saveUserNative(BACHIR_ID, "bachir", "Bachir", "bachir@plantsocial.com", defaultPassword,
                                "Full-Stack Developer & Botanist", Role.USER.name(), LocalDateTime.now().minusDays(30));
                saveUserNative(ALAE_ID, "alae", "Alae", "alae@plantsocial.com", defaultPassword,
                                "Co-founder at Bach Media & Plant Enthusiast", Role.USER.name(),
                                LocalDateTime.now().minusDays(20));
                saveUserNative(PHANTOM_ID, "phantom_admin", "PhantomAdmin", "admin@plantsocial.com", defaultPassword,
                                "The Ghost in the Machine", Role.ADMIN.name(), LocalDateTime.now().minusDays(50));
                saveUserNative(ALICE_ID, "alice_grows", "Alice Wonderland", "alice@plantsocial.com", defaultPassword,
                                "Monstera Mom and casual gardener.", Role.USER.name(),
                                LocalDateTime.now().minusDays(10));
                saveUserNative(BOB_ID, "bobby_leaf", "Robert Branch", "bob@plantsocial.com", defaultPassword,
                                "I like plants that don't die easily.", Role.USER.name(),
                                LocalDateTime.now().minusDays(5));

                log.info("Successfully seeded 5 users.");

                List<Post> posts = new ArrayList<>();

                posts.add(createPost(userRepository.findById(BACHIR_ID).orElseThrow(),
                                "Just learned how to properly care for my English Ivy! Watch the humidity.",
                                "English Ivy"));
                posts.add(createPost(userRepository.findById(ALICE_ID).orElseThrow(),
                                "My Monstera is finally dropping a new leaf! The fenestrations are beautiful. So excited.",
                                "Monstera"));
                posts.add(createPost(userRepository.findById(BOB_ID).orElseThrow(),
                                "Is it possible to overwater a Snake Plant? Asking for a friend...", "Snake Plant"));
                posts.add(createPost(userRepository.findById(ALAE_ID).orElseThrow(),
                                "If your Pothos is looking sad, give it some indirect sunlight. They are so resilient!",
                                "Pothos"));
                posts.add(createPost(userRepository.findById(BACHIR_ID).orElseThrow(),
                                "Protip: Don't repot during the winter unless absolutely necessary.", "General"));

                posts.add(createPost(userRepository.findById(BACHIR_ID).orElseThrow(),
                                "Setting up Docker on Fedora today while my Monstera watches.", "Monstera"));
                posts.add(createPost(userRepository.findById(ALAE_ID).orElseThrow(),
                                "Debugging Angular routing issues all morning... At least the office plants are thriving.",
                                "Office Plants"));
                posts.add(createPost(userRepository.findById(PHANTOM_ID).orElseThrow(),
                                "System architecture evolving beautifully. Everything is connected. The root system expands.",
                                "Roots"));
                posts.add(createPost(userRepository.findById(BACHIR_ID).orElseThrow(),
                                "Refactoring the entire backend while sipping coffee next to my Bonsai.", "Bonsai"));
                posts.add(createPost(userRepository.findById(ALAE_ID).orElseThrow(),
                                "Deploying the latest build to production! Fingers crossed.", "General"));

                posts.add(createPost(userRepository.findById(PHANTOM_ID).orElseThrow(),
                                "Gardening is the ultimate cure for temporal anxiety. Just take it one day at a time.",
                                "Garden"));
                posts.add(createPost(userRepository.findById(ALICE_ID).orElseThrow(),
                                "There's something incredibly peaceful about waking up and watering the garden before the world starts moving.",
                                "Garden"));
                posts.add(createPost(userRepository.findById(BOB_ID).orElseThrow(),
                                "Watching a plant recover from the brink of death is secretly the most inspiring thing.",
                                "General"));
                posts.add(createPost(userRepository.findById(ALAE_ID).orElseThrow(),
                                "Sometimes you have to prune the dead leaves so the rest of the plant can grow. A metaphor for life.",
                                "Pruning"));
                posts.add(createPost(userRepository.findById(BACHIR_ID).orElseThrow(),
                                "Patience is a muscle, and plants are the gym.", "General"));

                postRepository.saveAll(posts);
                log.info("Successfully seeded 15 posts.");
        }

        private Post createPost(User author, String content, String tags) {
                Post post = new Post();
                post.setAuthor(author);
                post.setContent(content);
                post.setPlantTag(tags);
                post.setCreatedAt(LocalDateTime.now().minusHours(Math.round(Math.random() * 72)));
                return post;
        }

        private void saveUserNative(UUID id, String username, String fullName, String email, String password,
                        String bio, String role, LocalDateTime createdAt) {
                if (!userRepository.existsById(id)) {
                        String sql = "INSERT INTO users (id, username, full_name, email, password, bio, role, created_at, enabled) "
                                        +
                                        "VALUES (:id, :username, :fullName, :email, :password, :bio, :role, :createdAt, true)";

                        Query query = entityManager.createNativeQuery(sql);
                        query.setParameter("id", id);
                        query.setParameter("username", username);
                        query.setParameter("fullName", fullName);
                        query.setParameter("email", email);
                        query.setParameter("password", password);
                        query.setParameter("bio", bio);
                        query.setParameter("role", role);
                        query.setParameter("createdAt", java.sql.Timestamp.valueOf(createdAt));

                        query.executeUpdate();
                }
        }
}
