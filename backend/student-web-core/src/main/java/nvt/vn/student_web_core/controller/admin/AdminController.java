package nvt.vn.student_web_core.controller.admin;

import nvt.vn.student_web_core.model.Report;
import nvt.vn.student_web_core.repository.ReportRepo;
import nvt.vn.student_web_core.model.Comment;
import nvt.vn.student_web_core.model.ForumPost;
import jakarta.validation.Valid;
import nvt.vn.student_web_core.model.Admin;
import nvt.vn.student_web_core.model.ViewStatus;
import nvt.vn.student_web_core.payload.admin.ResolveReportRequest;
import nvt.vn.student_web_core.repository.AdminRepo;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
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

    private final AdminRepo adminRepo;

    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {

        List<Map<String, Object>> result = reportRepo.findAllReports()
                .stream()
                .map(report -> {

                    Map<String, Object> item = new HashMap<>();

                    item.put("reportId", report.getReportId());
                    item.put("reason", report.getReason());
                    item.put("adminNote", report.getAdminNote());
                    item.put("resolved", report.isResolved());
                    item.put("createAt", report.getCreateAt());
                    item.put("handleAt", report.getHandleAt());

                    item.put("reporterName",
                            report.getStudent() != null
                                    ? report.getStudent().getFullName()
                                    : "Không xác định");

                    item.put("handledBy",
                            report.getHandledBy() != null
                                    ? report.getHandledBy().getFullName()
                                    : null);

                    // Báo cáo bài viết
                    if (report.getForumPost() != null
                            && report.getComment() == null) {

                        ForumPost post = report.getForumPost();

                        item.put("targetStatus", post.getStatus().name());

                        item.put("reportType", "POST");
                        item.put("targetId", post.getPostId());
                        item.put("targetTitle", post.getTitle());
                        item.put("targetContent", post.getContent());

                        item.put("authorName",
                                post.getAuthor() != null
                                        ? post.getAuthor().getFullName()
                                        : "Không xác định");
                    }

                    // Báo cáo bình luận
                    else if (report.getComment() != null) {

                        Comment comment = report.getComment();

                        item.put("targetStatus", comment.isActive());

                        item.put("reportType", "COMMENT");
                        item.put("targetId", comment.getCommentId());
                        item.put("targetContent", comment.getContent());

                        item.put("targetTitle",
                                comment.getForumPost() != null
                                        ? comment.getForumPost().getTitle()
                                        : null);

                        item.put("authorName",
                                comment.getUser() != null
                                        ? comment.getUser().getFullName()
                                        : "Không xác định");
                    }

                    return item;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/reports/{reportId}/resolve")
    @Transactional
    public ResponseEntity<?> resolveReport(
            @PathVariable Integer reportId,
            @Valid @RequestBody ResolveReportRequest request
    ) {

        Report report = reportRepo.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy báo cáo"
                ));

        if (report.isResolved()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Báo cáo này đã được xử lý"
            );
        }

        // Lấy ADMIN hiện tại
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        Admin admin = adminRepo.findById(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Tài khoản hiện tại không phải ADMIN"
                ));

        // Nếu nội dung vi phạm thì ẩn nội dung
        if (request.violation()) {

            // Báo cáo bài viết
            if (report.getForumPost() != null
                    && report.getComment() == null) {

                ForumPost post = report.getForumPost();
                post.setStatus(ViewStatus.HIDDEN);
            }

            // Báo cáo bình luận
            else if (report.getComment() != null) {

                Comment comment = report.getComment();
                comment.setActive(false);
            }
        }

        // Cập nhật trạng thái báo cáo
        report.setResolved(true);
        report.setAdminNote(request.adminNote().trim());
        report.setHandleAt(LocalDateTime.now());
        report.setHandledBy(admin);

        reportRepo.save(report);

        return ResponseEntity.ok(
                java.util.Map.of(
                        "message", "Xử lý báo cáo thành công",
                        "reportId", report.getReportId(),
                        "resolved", report.isResolved()
                )
        );
    }
}