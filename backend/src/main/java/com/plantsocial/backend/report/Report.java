package com.plantsocial.backend.report;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.plantsocial.backend.model.Post;
import com.plantsocial.backend.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "reporter_id", "post_id" })
})
@EntityListeners(AuditingEntityListener.class)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @JsonIgnoreProperties({ "posts", "following", "followers", "password" })
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnoreProperties({ "user", "comments", "likes" })
    private Post post;

    @Column(nullable = false)
    private String reason;

    @Column(length = 500)
    private String description;

    @Builder.Default
    private String status = "PENDING"; // PENDING, REVIEWED, RESOLVED, DISMISSED

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
