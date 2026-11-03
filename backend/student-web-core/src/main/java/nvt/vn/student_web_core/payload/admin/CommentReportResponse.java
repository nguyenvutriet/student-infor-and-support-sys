
package nvt.vn.student_web_core.payload.admin;

import java.time.LocalDateTime;

public record CommentReportResponse(
        Integer reportId,
        Integer commentId,
        String commentContent,
        String commenterId,
        String commenterName,
        String postTitle,
        String reporterId,
        String reporterName,
        String reason,
        boolean commentActive,
        boolean resolved,
        String adminNote,
        String handledBy,
        LocalDateTime createAt,
        LocalDateTime handleAt
) {
}
