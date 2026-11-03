package nvt.vn.student_web_core.payload.admin;

import jakarta.validation.constraints.NotBlank;

public record ChangeAccountStatusRequest(@NotBlank String status) {}
