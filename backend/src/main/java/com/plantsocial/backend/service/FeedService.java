package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.CommentRequest;
import com.plantsocial.backend.dto.CreatePostRequest;
import com.plantsocial.backend.dto.PostResponse;
import com.plantsocial.backend.model.Comment;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.model.PostLike;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.repository.CommentRepository;
import com.plantsocial.backend.repository.PostLikeRepository;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public Page<PostResponse> getFeed(Pageable pageable) {
        User currentUser = getCurrentUser();
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(post -> mapToPostResponse(post, currentUser));
    }

    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        User user = getCurrentUser();
        Post post = Post.builder()
                .content(request.content())
                .imageUrl(request.imageUrl())
                .author(user)
                .build();
        Post savedPost = postRepository.save(post);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public void likePost(UUID postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        if (postLikeRepository.existsByPostAndUser(post, user)) {
            postLikeRepository.deleteByPostAndUser(post, user); // Unlike if already liked
        } else {
            PostLike like = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(like);
        }
    }

    @Transactional
    public void commentOnPost(UUID postId, CommentRequest request) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.content())
                .post(post)
                .author(user)
                .build();
        commentRepository.save(comment);
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private PostResponse mapToPostResponse(Post post, User currentUser) {
        long likesCount = postLikeRepository.countByPost(post);
        boolean likedByCurrentUser = postLikeRepository.existsByPostAndUser(post, currentUser);

        return new PostResponse(
                post.getId(),
                post.getContent(),
                post.getImageUrl(),
                post.getAuthor().getFullName(),
                post.getCreatedAt(),
                likesCount,
                likedByCurrentUser);
    }
}
