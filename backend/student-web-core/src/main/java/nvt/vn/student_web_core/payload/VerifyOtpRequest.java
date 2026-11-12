package nvt.vn.student_web_core.payload;

public record VerifyOtpRequest(String username, String email, String otp) {
}
