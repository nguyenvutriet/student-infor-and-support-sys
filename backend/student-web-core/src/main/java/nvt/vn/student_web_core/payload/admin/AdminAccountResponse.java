package nvt.vn.student_web_core.payload.admin;

public record AdminAccountResponse(
    String userId,
    String fullName,
    String email,
    String role,
    String status,
    String major,
    String departmentName
) {}
