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

@Slf4j
@Component
@RequiredArgsConstructor
public class BackendSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;

    // Hardcoded UUIDs so the Gamification service can reference them!
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

        // 1. Generate Mock Users
        String defaultPassword = passwordEncoder.encode("demo123");

        User bachir = User.builder()
                .id(BACHIR_ID)
                .username("bachir")
                .fullName("Bachir")
                .email("bachir@plantsocial.com")
                .password(defaultPassword)
                .bio("Full-Stack Developer & Botanist")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now().minusDays(30))
                .build();

        User alae = User.builder()
                .id(ALAE_ID)
                .username("alae")
                .fullName("Alae")
                .email("alae@plantsocial.com")
                .password(defaultPassword)
                .bio("Co-founder at Bach Media & Plant Enthusiast")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now().minusDays(20))
                .build();

        User phantom = User.builder()
                .id(PHANTOM_ID)
                .username("phantom_admin")
                .fullName("PhantomAdmin")
                .email("admin@plantsocial.com")
                .password(defaultPassword)
                .bio("The Ghost in the Machine")
                .role(Role.ADMIN)
                .enabled(true)
                .createdAt(LocalDateTime.now().minusDays(50))
                .build();

        User alice = User.builder()
                .id(ALICE_ID)
                .username("alice_grows")
                .fullName("Alice Wonderland")
                .email("alice@plantsocial.com")
                .password(defaultPassword)
                .bio("Monstera Mom and casual gardener.")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        User bob = User.builder()
                .id(BOB_ID)
                .username("bobby_leaf")
                .fullName("Robert Branch")
                .email("bob@plantsocial.com")
                .password(defaultPassword)
                .bio("I like plants that don't die easily.")
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        userRepository.saveAll(List.of(bachir, alae, phantom, alice, bob));
        log.info("Successfully seeded 5 users.");

        // 2. Generate Mock Posts
        List<Post> posts = new ArrayList<>();

        // Horticulture Tips
        posts.add(createPost(bachir, "Just learned how to properly care for my English Ivy! Watch the humidity.",
                "#PlantCare #EnglishIvy"));
        posts.add(createPost(alice,
                "My Monstera is finally dropping a new leaf! The fenestrations are beautiful. So excited.",
                "#PlantCare #MonsteraMonday"));
        posts.add(createPost(bob, "Is it possible to overwater a Snake Plant? Asking for a friend...",
                "#PlantHelp #SnakePlant"));
        posts.add(createPost(alae,
                "If your Pothos is looking sad, give it some indirect sunlight. They are so resilient!",
                "#PlantCare #Growth"));
        posts.add(createPost(bachir, "Protip: Don't repot during the winter unless absolutely necessary.",
                "#PlantCare #WinterTips"));

        // Tech & Vibe Coding
        posts.add(createPost(bachir, "Setting up Docker on Fedora today while my Monstera watches.",
                "#VibeCoding #Linux"));
        posts.add(createPost(alae,
                "Debugging Angular routing issues all morning... At least the office plants are thriving.",
                "#VibeCoding #Frontend"));
        posts.add(createPost(phantom,
                "System architecture evolving beautifully. Everything is connected. The root system expands.",
                "#Architecture #VibeCoding"));
        posts.add(createPost(bachir, "Refactoring the entire backend while sipping coffee next to my Bonsai.",
                "#VibeCoding #Java"));
        posts.add(createPost(alae, "Deploying the latest build to production! Fingers crossed.", "#DevOps #Growth"));

        // Psychological / Observations
        posts.add(createPost(phantom,
                "Gardening is the ultimate cure for temporal anxiety. Just take it one day at a time.",
                "#Growth #Psychology"));
        posts.add(createPost(alice,
                "There's something incredibly peaceful about waking up and watering the garden before the world starts moving.",
                "#MorningRoutine #Gardening"));
        posts.add(createPost(bob,
                "Watching a plant recover from the brink of death is secretly the most inspiring thing.",
                "#Resilience"));
        posts.add(createPost(alae,
                "Sometimes you have to prune the dead leaves so the rest of the plant can grow. A metaphor for life.",
                "#Growth"));
        posts.add(createPost(bachir, "Patience is a muscle, and plants are the gym.", "#Growth #Patience"));

        postRepository.saveAll(posts);
        log.info("Successfully seeded 15 posts.");
    }

    private Post createPost(User author, String content, String tags) {
        Post post = new Post();
        post.setAuthor(author);
        post.setContent(content);
        post.setPlantTag(tags);
        // Bypassing auditing for timestamps to simulate history
        post.setCreatedAt(LocalDateTime.now().minusHours(Math.round(Math.random() * 72)));
        return post;
    }
}
