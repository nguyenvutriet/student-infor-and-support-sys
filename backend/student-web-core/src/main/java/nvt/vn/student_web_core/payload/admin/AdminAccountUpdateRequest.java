package nvt.vn.student_web_core.payload.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminAccountUpdateRequest(
    @NotBlank @Size(max=150) String fullName,
    @NotBlank @Email @Size(max=150) String email,
    @Size(min=8, max=100) String password,
    String status
) {}
