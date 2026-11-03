package nvt.vn.student_web_core.payload.admin;

import java.time.LocalDateTime;

public record PostReportResponse(
        Integer reportId,
        Integer postId,
        String postTitle,
        String postContent,
        String authorName,
        String reporterName,
        String reason,
        String adminNote,
        boolean resolved,
        LocalDateTime createAt,
        LocalDateTime handleAt
) {
}