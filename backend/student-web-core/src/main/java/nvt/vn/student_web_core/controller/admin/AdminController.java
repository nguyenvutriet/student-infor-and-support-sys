package nvt.vn.student_web_core.controller.admin;

import nvt.vn.student_web_core.payload.admin.PostReportResponse;
import nvt.vn.student_web_core.model.Report;
import nvt.vn.student_web_core.repository.ReportRepo;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ReportRepo reportRepo;

    // ==============================
    // QUẢN LÝ BÁO CÁO BÀI VIẾT
    // ==============================

    @GetMapping("/post-reports")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PostReportResponse>> getPostReports() {

        List<PostReportResponse> result = reportRepo
                .findAllPostReports()
                .stream()
                .map(this::convertToPostReportResponse)
                .toList();

        return ResponseEntity.ok(result);
    }

    // Chuyển Entity Report thành DTO
    private PostReportResponse convertToPostReportResponse(Report report) {

        var post = report.getForumPost();

        String authorName = post.getAuthor() != null
                ? post.getAuthor().getFullName()
                : "Không xác định";

        String reporterName = report.getStudent() != null
                ? report.getStudent().getFullName()
                : "Không xác định";

        return new PostReportResponse(
                report.getReportId(),
                post.getPostId(),
                post.getTitle(),
                post.getContent(),
                authorName,
                reporterName,
                report.getReason(),
                report.getAdminNote(),
                report.isResolved(),
                report.getCreateAt(),
                report.getHandleAt()
        );
    }

    // ==============================
    // THỐNG KÊ BÁO CÁO BÀI VIẾT
    // ==============================

    @GetMapping("/post-reports/statistics")
    public ResponseEntity<?> getPostReportStatistics() {

        return ResponseEntity.ok(
                java.util.Map.of(
                        "total", reportRepo.countPostReports(),
                        "pending", reportRepo.countPendingPostReports(),
                        "resolved", reportRepo.countResolvedPostReports()
                )
        );
    }
}