package com.plantsocial.backend.report;

import com.plantsocial.backend.dto.ReportDTO;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.repository.PostRepository;
import com.plantsocial.backend.user.User;
import com.plantsocial.backend.user.UserRepository;
import com.plantsocial.backend.block.BlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final BlockService blockService;

    @Transactional
    public void createReport(ReportDTO dto, String username) {
        // UserDetails.getUsername() actually returns email in our User entity
        // implementation
        User reporter = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        if (reportRepository.existsByReporterIdAndPostId(reporter.getId(), dto.postId())) {
            throw new IllegalArgumentException("You have already reported this post");
        }

        Post post = postRepository.findById(dto.postId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Report report = Report.builder()
                .reporter(reporter)
                .post(post)
                .reason(dto.reason())
                .description(dto.description())
                .status("PENDING")
                .build();

        reportRepository.save(report);

        if (dto.blockUser()) {
            blockService.blockUser(reporter, post.getAuthor());
        }
    }
}
