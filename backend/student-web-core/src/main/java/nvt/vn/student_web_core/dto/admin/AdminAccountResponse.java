package nvt.vn.student_web_core.dto.admin;

public record AdminAccountResponse(
    String userId,
    String fullName,
    String email,
    String role,
    String status,
    String major,
    String departmentName
) {}
