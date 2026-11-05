
package nvt.vn.student_web_core.payload.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveReportRequest(
        @NotNull Boolean violation,
        @NotBlank String adminNote
) {
}
