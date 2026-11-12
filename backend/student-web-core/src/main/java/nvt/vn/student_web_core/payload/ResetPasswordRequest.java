package nvt.vn.student_web_core.payload;

public record ResetPasswordRequest(String username, String resetToken,
                                   String newPassword, String confirmPassword) {
}
