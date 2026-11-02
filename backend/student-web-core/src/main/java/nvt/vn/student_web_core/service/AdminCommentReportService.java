
package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.dto.admin.CommentReportResponse;
import nvt.vn.student_web_core.dto.admin.ResolveCommentReportRequest;
import nvt.vn.student_web_core.model.Admin;
import nvt.vn.student_web_core.model.Comment;
import nvt.vn.student_web_core.model.Report;
import nvt.vn.student_web_core.repository.AdminRepo;
import nvt.vn.student_web_core.repository.ReportRepo;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminCommentReportService {

    private final ReportRepo reportRepo;
    private final AdminRepo adminRepo;

    @Transactional(readOnly = true)
    public List<CommentReportResponse> getAllReports() {
        return reportRepo.findAllCommentReports()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommentReportResponse getReportDetail(Integer reportId) {
        Report report = findCommentReport(reportId);
        return toResponse(report);
    }

    public CommentReportResponse resolveReport(
            Integer reportId,
            ResolveCommentReportRequest request
    ) {
        Report report = findCommentReport(reportId);

        if (report.isResolved()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Báo cáo này đã được xử lý"
            );
        }

        Comment comment = report.getComment();

        if (request.violation()) {
            comment.setActive(false);
        }

        Admin admin = getCurrentAdmin();

        report.setResolved(true);
        report.setAdminNote(request.adminNote().trim());
        report.setHandleAt(LocalDateTime.now());
        report.setHandledBy(admin);

        reportRepo.save(report);

        return toResponse(report);
    }


    @Transactional(readOnly = true)
    public CommentReportStatistics getStatistics() {

        long total = reportRepo.countCommentReports();

        long pending = reportRepo.countPendingCommentReports();

        long resolved = reportRepo.countResolvedCommentReports();

        return new CommentReportStatistics(
                total,
                pending,
                resolved
        );
    }

    private Report findCommentReport(Integer reportId) {
        return reportRepo.findCommentReportById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy báo cáo bình luận"
                ));
    }

    private Admin getCurrentAdmin() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        String userId = authentication.getName();

        return adminRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Tài khoản hiện tại không phải ADMIN"
                ));
    }

    private CommentReportResponse toResponse(Report report) {

        Comment comment = report.getComment();

        String commenterId = null;
        String commenterName = null;

        if (comment.getUser() != null) {
            commenterId = comment.getUser().getUserId();
            commenterName = comment.getUser().getFullName();
        }

        String postTitle = null;

        if (comment.getForumPost() != null) {
            postTitle = comment.getForumPost().getTitle();
        }

        String reporterId = null;
        String reporterName = null;

        if (report.getStudent() != null) {
            reporterId = report.getStudent().getUserId();
            reporterName = report.getStudent().getFullName();
        }

        String handledBy = null;

        if (report.getHandledBy() != null) {
            handledBy = report.getHandledBy().getFullName();
        }

        return new CommentReportResponse(
                report.getReportId(),
                comment.getCommentId(),
                comment.getContent(),
                commenterId,
                commenterName,
                postTitle,
                reporterId,
                reporterName,
                report.getReason(),
                comment.isActive(),
                report.isResolved(),
                report.getAdminNote(),
                handledBy,
                report.getCreateAt(),
                report.getHandleAt()
        );
    }

    public record CommentReportStatistics(
            long total,
            long pending,
            long resolved
    ) {
    }
}
