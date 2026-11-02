package nvt.vn.student_web_core.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminAccountCreateRequest(
    @NotBlank @Size(max=50) String userId,
    @NotBlank @Size(max=150) String fullName,
    @NotBlank @Email @Size(max=150) String email,
    @NotBlank @Size(min=8, max=100) String password,
    @NotBlank String role,
    String status
) {}
