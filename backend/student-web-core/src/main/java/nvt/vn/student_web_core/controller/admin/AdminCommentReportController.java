
package nvt.vn.student_web_core.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.payload.admin.CommentReportResponse;
import nvt.vn.student_web_core.payload.admin.ResolveCommentReportRequest;
import nvt.vn.student_web_core.service.AdminCommentReportService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/comment-reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommentReportController {

    private final AdminCommentReportService service;

    // Danh sách báo cáo bình luận
    @GetMapping
    public ResponseEntity<List<CommentReportResponse>> getAllReports() {
        return ResponseEntity.ok(service.getAllReports());
    }

    // Chi tiết báo cáo
    @GetMapping("/{reportId}")
    public ResponseEntity<CommentReportResponse> getReportDetail(
            @PathVariable Integer reportId
    ) {
        return ResponseEntity.ok(
                service.getReportDetail(reportId)
        );
    }

    // Thống kê báo cáo
    @GetMapping("/statistics")
    public ResponseEntity<AdminCommentReportService.CommentReportStatistics>
    getStatistics() {
        return ResponseEntity.ok(service.getStatistics());
    }

    // Xử lý báo cáo
    @PatchMapping("/{reportId}/resolve")
    public ResponseEntity<CommentReportResponse> resolveReport(
            @PathVariable Integer reportId,
            @Valid @RequestBody ResolveCommentReportRequest request
    ) {
        return ResponseEntity.ok(
                service.resolveReport(reportId, request)
        );
    }
}
