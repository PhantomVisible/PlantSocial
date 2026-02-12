package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.model.Plant;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.model.PostLike;
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

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public Page<PostResponse> getFeed(Pageable pageable) {
        User currentUser = getCurrentUser();
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(post -> mapToPostResponse(post, currentUser));
    }

    @Transactional
    public PostResponse createPost(String caption, MultipartFile file, UUID plantId) {
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
                .build();
        Post savedPost = postRepository.save(post);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public PostResponse editPost(UUID postId, String caption) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        post.setContent(caption);
        Post savedPost = postRepository.save(post);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public void deletePost(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        // Delete related likes and comments first
        postLikeRepository.deleteAllByPost(post);
        commentRepository.deleteAllByPost(post);
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
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public PostResponse mapToPostResponsePublic(Post post, User currentUser) {
        return mapToPostResponse(post, currentUser);
    }

    private PostResponse mapToPostResponse(Post post, User currentUser) {
        long likesCount = postLikeRepository.countByPost(post);
        long commentCount = commentRepository.countByPost(post);
        boolean likedByCurrentUser = currentUser != null && postLikeRepository.existsByPostAndUser(post, currentUser);

        UUID plantId = post.getPlant() != null ? post.getPlant().getId() : null;
        String plantNickname = post.getPlant() != null ? post.getPlant().getNickname() : null;

        return new PostResponse(
                post.getId(),
                post.getContent(),
                post.getImageUrl(),
                post.getAuthor().getFullName(),
                post.getAuthor().getId(),
                post.getCreatedAt(),
                likesCount,
                commentCount,
                likedByCurrentUser,
                plantId,
                plantNickname);
    }
}
