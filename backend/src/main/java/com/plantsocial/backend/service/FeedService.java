package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.model.PostLike;
import com.plantsocial.backend.notification.model.NotificationType;
import com.plantsocial.backend.notification.NotificationService;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.repository.CommentRepository;
import com.plantsocial.backend.repository.PlantRepository;
import com.plantsocial.backend.repository.PostLikeRepository;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final Logger log = LoggerFactory.getLogger(FeedService.class);

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public Page<PostResponse> getFeed(Pageable pageable, String plant, String query) {
        System.out.println("DEBUG: Entering getFeed");
        User currentUser = getCurrentUser();
        System.out.println("DEBUG: Current user resolved: " + (currentUser != null ? currentUser.getEmail() : "null"));

        Page<Post> posts;
        if (query != null && !query.isBlank()) {
            System.out.println("DEBUG: Searching posts by query: " + query);
            posts = postRepository.findByContentContainingIgnoreCaseOrderByCreatedAtDesc(query.trim(), pageable);
        } else if (plant != null && !plant.isBlank()) {
            System.out.println("DEBUG: Fetching posts by plant tag: " + plant);
            posts = postRepository.findByPlantTagIgnoreCaseOrderByCreatedAtDesc(plant.trim(), pageable);
        } else {
            System.out.println("DEBUG: Fetching all posts");
            posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        System.out.println("DEBUG: Posts fetched: " + posts.getTotalElements());

        return posts.map(post -> {
            try {
                return mapToPostResponse(post, currentUser);
            } catch (Exception e) {
                System.out.println("DEBUG: Error mapping post " + post.getId());
                e.printStackTrace();
                throw e;
            }
        });
    }

    public PostResponse getPostById(UUID postId) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return mapToPostResponse(post, currentUser);
    }

    @Transactional
    public PostResponse createPost(String caption, MultipartFile file, UUID plantId, String plantTag) {
        User user = getCurrentUser();

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            imageUrl = fileStorageService.storeFile(file);
        }

        Plant plant = null;
        if (plantId != null) {
            plant = plantRepository.findById(plantId).orElse(null);
        }

        Post post = Post.builder()
                .content(caption)
                .imageUrl(imageUrl)
                .author(user)
                .plant(plant)
                .plantTag(plantTag != null && !plantTag.isBlank() ? plantTag.trim() : null)
                .build();
        Post savedPost = postRepository.save(post);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public PostResponse editPost(UUID postId, String caption, String plantTag) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setContent(caption);
        // Set or clear plantTag
        post.setPlantTag(plantTag != null && !plantTag.isBlank() ? plantTag.trim() : null);
        Post savedPost = postRepository.save(post);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public void deletePost(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        // CascadeType.ALL on comments/likes handles cleanup automatically
        postRepository.delete(post);
    }

    @Transactional
    public void likePost(UUID postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (postLikeRepository.existsByPostAndUser(post, user)) {
            postLikeRepository.deleteByPostAndUser(post, user);
        } else {
            PostLike like = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(like);

            // Notify post author
            notificationService.createNotification(
                    post.getAuthor(),
                    user,
                    NotificationType.LIKE,
                    user.getFullName() + " liked your post",
                    post.getId());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public PostResponse mapToPostResponsePublic(Post post, User currentUser) {
        return mapToPostResponse(post, currentUser);
    }

    private PostResponse mapToPostResponse(Post post, User currentUser) {
        long likesCount = postLikeRepository.countByPost(post);
        long commentCount = commentRepository.countByPost(post);
        boolean likedByCurrentUser = currentUser != null && postLikeRepository.existsByPostAndUser(post, currentUser);

        // Repost logic
        long repostCount = postRepository.countByRepostOfId(post.getId());
        boolean isRepostedByCurrentUser = currentUser != null
                && postRepository.existsByAuthorIdAndRepostOfId(currentUser.getId(), post.getId());

        UUID plantId = post.getPlant() != null ? post.getPlant().getId() : null;
        String plantNickname = post.getPlant() != null ? post.getPlant().getNickname() : null;

        return new PostResponse(
                post.getId(),
                post.getContent(),
                post.getImageUrl(),
                post.getAuthor().getFullName(),
                post.getAuthor().getHandle(),
                post.getAuthor().getId(),
                post.getCreatedAt(),
                likesCount,
                commentCount,
                likedByCurrentUser,
                plantId,
                plantNickname,
                post.getPlantTag(),
                post.getAuthor().getProfilePictureUrl(),
                post.getRepostOf() != null ? mapToPostResponse(post.getRepostOf(), currentUser) : null,
                repostCount,
                isRepostedByCurrentUser);
    }

    @Transactional
    public void repostPost(UUID postId) {
        User user = getCurrentUser();
        log.info("repostPost called: postId={}, userId={}", postId, user.getId());

        Post targetPost = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

        // Flatten reposts: Always repost the ROOT original post
        Post originalPost = targetPost;
        while (originalPost.getRepostOf() != null) {
            originalPost = originalPost.getRepostOf();
        }
        log.info("Original post resolved: originalPostId={}", originalPost.getId());

        // Toggle Repost Logic
        boolean alreadyReposted = postRepository.existsByAuthorIdAndRepostOfId(user.getId(), originalPost.getId());
        log.info("Already reposted: {}", alreadyReposted);

        if (alreadyReposted) {
            // Undo repost
            java.util.Optional<Post> existingRepost = postRepository.findByAuthorIdAndRepostOfId(user.getId(),
                    originalPost.getId());
            existingRepost.ifPresent(repost -> {
                log.info("Deleting repost: repostId={}", repost.getId());
                postRepository.delete(repost);
                postRepository.flush();
            });
        } else {
            // Create new repost
            Post repost = Post.builder()
                    .author(user)
                    .repostOf(originalPost)
                    .build();

            log.info("Saving new repost for originalPostId={}", originalPost.getId());
            postRepository.save(repost);

            // Notify original author (only if not self-repost)
            if (!originalPost.getAuthor().getId().equals(user.getId())) {
                notificationService.createNotification(
                        originalPost.getAuthor(),
                        user,
                        NotificationType.REPOST,
                        user.getFullName() + " reposted your post",
                        originalPost.getId());
            }
        }
    }
}
