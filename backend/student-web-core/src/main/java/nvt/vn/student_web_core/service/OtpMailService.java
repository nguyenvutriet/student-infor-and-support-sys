package nvt.vn.student_web_core.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import nvt.vn.student_web_core.handler.ForgotPasswordException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class OtpMailService {

    private static final Logger log = LoggerFactory.getLogger(OtpMailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.forgot-password.mail-from:}")
    private String mailFrom;

    @Value("${app.forgot-password.dev-log-otp:false}")
    private boolean devLogOtp;

    public OtpMailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendOtp(String to, String fullName, String otp, long ttlMinutes) {
        if (devLogOtp) {
            log.warn("[DEV] OTP quên mật khẩu gửi tới {} là: {} (chỉ bật dev-log-otp khi test!)", to, otp);
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            if (devLogOtp) {
                return;
            }
            log.error("Chưa cấu hình spring.mail.* nên không thể gửi OTP");
            throw new ForgotPasswordException(HttpStatus.SERVICE_UNAVAILABLE, "MAIL_NOT_CONFIGURED", null,
                    "Hệ thống chưa cấu hình gửi email, vui lòng liên hệ quản trị viên");
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            String from = !mailFrom.isBlank() ? mailFrom : smtpUsername;
            if (from != null && !from.isBlank()) {
                helper.setFrom(from);
            }
            helper.setSubject("[HCMUTE] Mã OTP đặt lại mật khẩu");
            helper.setText(buildHtml(fullName, otp, ttlMinutes), true);
            sender.send(message);
        } catch (MessagingException | MailException e) {
            log.error("Gửi OTP tới {} thất bại: {}", to, e.getMessage());
            throw new ForgotPasswordException(HttpStatus.SERVICE_UNAVAILABLE, "MAIL_SEND_FAILED", null,
                    "Không thể gửi email lúc này, vui lòng thử lại sau");
        }
    }

    private String buildHtml(String fullName, String otp, long ttlMinutes) {
        String name = HtmlUtils.htmlEscape(fullName == null || fullName.isBlank() ? "bạn" : fullName);
        return "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;"
                + "border:1px solid #e3e7ef;border-radius:6px;padding:28px\">"
                + "<h2 style=\"margin:0 0 12px;color:#3f51a3\">Đặt lại mật khẩu</h2>"
                + "<p>Xin chào <b>" + name + "</b>,</p>"
                + "<p>Mã OTP để đặt lại mật khẩu của bạn là:</p>"
                + "<p style=\"font-size:34px;letter-spacing:10px;font-weight:700;color:#00538f;"
                + "background:#e8effc;text-align:center;padding:14px;border-radius:4px\">" + otp + "</p>"
                + "<p>Mã có hiệu lực trong <b>" + ttlMinutes + " phút</b>. "
                + "Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>"
                + "<p style=\"color:#6b7a99;font-size:13px\">Nếu bạn không yêu cầu đặt lại mật khẩu, "
                + "hãy bỏ qua email này.</p>"
                + "</div>";
    }
}
