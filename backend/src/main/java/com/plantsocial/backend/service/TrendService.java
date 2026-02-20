package com.plantsocial.backend.service;

import com.plantsocial.backend.dto.TrendDTO;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrendService {

    private final PostRepository postRepository;

    public List<TrendDTO> getTrendingTopics(String tag) {
        // Fetch posts from last 24 hours
        LocalDateTime startDate = LocalDateTime.now().minusHours(24);
        Pageable topFive = PageRequest.of(0, 5);

        List<Post> trendingPosts;
        if (tag != null && !tag.trim().isEmpty()) {
            trendingPosts = postRepository.findTrendingPostsByTag(startDate, tag, topFive).getContent();
        } else {
            trendingPosts = postRepository.findTrendingPosts(startDate, topFive).getContent();
        }

        return trendingPosts.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private TrendDTO mapToDTO(Post post) {
        String topic = post.getContent();
        if (topic != null && topic.length() > 40) {
            topic = topic.substring(0, 40) + "...";
        } else if (topic == null || topic.isEmpty()) {
            topic = "New Photo"; // Fallback for image-only posts
        }

        int likeCount = post.getLikes().size();
        String stats = formatLikeCount(likeCount);

        return new TrendDTO(
                post.getId(),
                topic,
                "Trending in your network",
                stats);
    }

    private String formatLikeCount(int count) {
        if (count >= 1000000) {
            return String.format("%.1fM Likes", count / 1000000.0);
        } else if (count >= 1000) {
            return String.format("%.1fk Likes", count / 1000.0);
        } else {
            return count + " Likes";
        }
    }
}
