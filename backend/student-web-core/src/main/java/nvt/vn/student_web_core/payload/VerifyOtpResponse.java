package nvt.vn.student_web_core.payload;

public record VerifyOtpResponse(String message, String resetToken, long expiresInSeconds) {
}
