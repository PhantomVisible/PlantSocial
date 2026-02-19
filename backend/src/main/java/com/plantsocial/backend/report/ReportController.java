package com.plantsocial.backend.report;

import com.plantsocial.backend.dto.ReportDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<Void> createReport(
            @RequestBody ReportDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Report request received: postId={}, reason={}, blockUser={}, user={}",
                dto.postId(), dto.reason(), dto.blockUser(),
                userDetails != null ? userDetails.getUsername() : "null");
        try {
            reportService.createReport(dto, userDetails.getUsername());
            log.info("Report created successfully");
            return ResponseEntity.accepted().build();
        } catch (Exception e) {
            log.error("Report creation failed", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
