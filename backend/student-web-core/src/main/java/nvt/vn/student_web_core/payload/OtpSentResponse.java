package nvt.vn.student_web_core.payload;

public record OtpSentResponse(String message,
                              String maskedEmail,
                              long expiresInSeconds,
                              long resendAfterSeconds) {
}
