
package nvt.vn.student_web_core.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveCommentReportRequest(
        @NotNull Boolean violation,
        @NotBlank String adminNote
) {
}
