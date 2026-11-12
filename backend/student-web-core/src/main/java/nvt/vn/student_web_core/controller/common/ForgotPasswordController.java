package nvt.vn.student_web_core.controller.common;

import nvt.vn.student_web_core.payload.OtpSentResponse;
import nvt.vn.student_web_core.payload.RequestOtpRequest;
import nvt.vn.student_web_core.payload.ResetPasswordRequest;
import nvt.vn.student_web_core.payload.VerifyOtpRequest;
import nvt.vn.student_web_core.payload.VerifyOtpResponse;
import nvt.vn.student_web_core.security.response.MessageResponse;
import nvt.vn.student_web_core.service.ForgotPasswordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/forgot-password")
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(ForgotPasswordService forgotPasswordService) {
        this.forgotPasswordService = forgotPasswordService;
    }

    @PostMapping("/request")
    public ResponseEntity<OtpSentResponse> request(@RequestBody RequestOtpRequest request) {
        return ResponseEntity.ok(forgotPasswordService.requestOtp(request));
    }

    @PostMapping("/resend")
    public ResponseEntity<OtpSentResponse> resend(@RequestBody RequestOtpRequest request) {
        return ResponseEntity.ok(forgotPasswordService.resendOtp(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(forgotPasswordService.verifyOtp(request));
    }

    @PostMapping("/reset")
    public ResponseEntity<MessageResponse> reset(@RequestBody ResetPasswordRequest request) {
        forgotPasswordService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Đổi mật khẩu thành công"));
    }
}
