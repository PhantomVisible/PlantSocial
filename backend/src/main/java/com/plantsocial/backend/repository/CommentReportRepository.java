package com.plantsocial.backend.repository;

import com.plantsocial.backend.model.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommentReportRepository extends JpaRepository<CommentReport, UUID> {
    boolean existsByReporterIdAndCommentId(UUID reporterId, UUID commentId);
}
