package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.handler.ForgotPasswordException;
import nvt.vn.student_web_core.model.AccountStatus;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.payload.OtpSentResponse;
import nvt.vn.student_web_core.payload.RequestOtpRequest;
import nvt.vn.student_web_core.payload.ResetPasswordRequest;
import nvt.vn.student_web_core.payload.VerifyOtpRequest;
import nvt.vn.student_web_core.payload.VerifyOtpResponse;
import nvt.vn.student_web_core.repository.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class ForgotPasswordService {

    static final String MSG_EMAIL_WRONG = "Email không chính xác, vui lòng thử lại";
    static final String MSG_USERNAME_WRONG = "Tên tài khoản không chính xác, vui lòng thử lại";
    static final String MSG_OTP_EXPIRED = "Mã OTP của bạn đã hết hạn";
    static final String MSG_OTP_WRONG = "Mã OTP không chính xác, vui lòng nhập lại";
    static final String MSG_OTP_EXCEEDED = "Bạn đã vượt quá số lần nhập";
    static final String MSG_CONFIRM_WRONG = "Mật khẩu xác nhận không chính xác";
    static final String MSG_PASSWORD_RULE =
            "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt";
    static final String MSG_ACCOUNT_LOCKED = "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên";

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern OTP_FORMAT = Pattern.compile("^\\d{6}$");

    private static final Pattern PASSWORD_RULE =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\p{Punct}).{8,}$");

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final OtpMailService otpMailService;

    private final Map<String, ResetSession> sessions = new ConcurrentHashMap<>();

    @Value("${app.forgot-password.otp-ttl-minutes:5}")
    private long otpTtlMinutes;

    @Value("${app.forgot-password.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Value("${app.forgot-password.max-otp-attempts:10}")
    private int maxOtpAttempts;

    @Value("${app.forgot-password.reset-token-ttl-minutes:10}")
    private long resetTokenTtlMinutes;

    public ForgotPasswordService(UserRepo userRepo,
                                 PasswordEncoder passwordEncoder,
                                 OtpMailService otpMailService) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.otpMailService = otpMailService;
    }

    public OtpSentResponse requestOtp(RequestOtpRequest request) {
        User user = verifyAccount(request.username(), request.email());
        String key = key(request.username());
        Instant now = Instant.now();

        ResetSession existing = sessions.get(key);
        if (existing != null && existing.isCoolingDown(now, cooldown())) {
            return toResponse(existing, now,
                    "Mã OTP đã được gửi trước đó, vui lòng kiểm tra email của bạn");
        }
        return issueOtp(user, key, now);
    }

    public OtpSentResponse resendOtp(RequestOtpRequest request) {
        User user = verifyAccount(request.username(), request.email());
        String key = key(request.username());
        Instant now = Instant.now();

        ResetSession existing = sessions.get(key);
        if (existing != null && existing.isCoolingDown(now, cooldown())) {
            throw new ForgotPasswordException(HttpStatus.TOO_MANY_REQUESTS, "RESEND_TOO_SOON", null,
                    "Vui lòng đợi " + existing.cooldownSecondsLeft(now, cooldown()) + " giây để gửi lại mã")
                    .retryAfter(existing.cooldownSecondsLeft(now, cooldown()));
        }
        return issueOtp(user, key, now);
    }

    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        requireField(request.username(), "username", "Vui lòng nhập tên tài khoản");
        requireField(request.email(), "email", "Vui lòng nhập email");
        requireField(request.otp(), "otp", "Vui lòng nhập mã OTP");

        ResetSession session = sessions.get(key(request.username()));
        if (session == null || !session.email.equalsIgnoreCase(request.email().trim())) {
            throw otpExpired();
        }

        Instant now = Instant.now();
        synchronized (session) {
            if (session.otpHash == null || now.isAfter(session.otpExpiresAt)) {
                throw otpExpired();
            }
            if (session.exhausted) {
                throw otpExceeded();
            }

            String otp = request.otp().trim();
            if (!OTP_FORMAT.matcher(otp).matches()) {

                throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "OTP_FORMAT", "otp",
                        "Mã OTP gồm 6 chữ số");
            }

            if (!MessageDigest.isEqual(session.otpHash, sha256(otp))) {
                session.failedAttempts++;
                if (session.failedAttempts >= maxOtpAttempts) {
                    session.exhausted = true;
                    throw otpExceeded();
                }
                throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "otp", MSG_OTP_WRONG)
                        .attemptsLeft(maxOtpAttempts - session.failedAttempts);   // 6.2
            }

            session.otpHash = null;
            String token = newToken();
            session.resetTokenHash = sha256(token);
            session.resetTokenExpiresAt = now.plus(Duration.ofMinutes(resetTokenTtlMinutes));
            return new VerifyOtpResponse("Xác minh thành công", token, Duration.ofMinutes(resetTokenTtlMinutes).toSeconds());
        }
    }


    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        requireField(request.username(), "username", "Vui lòng nhập tên tài khoản");
        String key = key(request.username());
        Instant now = Instant.now();

        ResetSession session = sessions.get(key);
        if (session == null || !session.hasValidResetToken(request.resetToken(), now)) {
            throw new ForgotPasswordException(HttpStatus.GONE, "RESET_SESSION_EXPIRED", null,
                    "Phiên đặt lại mật khẩu đã hết hạn, vui lòng thực hiện lại từ đầu");
        }

        requireField(request.newPassword(), "newPassword", "Vui lòng nhập mật khẩu mới");
        requireField(request.confirmPassword(), "confirmPassword", "Vui lòng xác nhận mật khẩu");

        if (!PASSWORD_RULE.matcher(request.newPassword()).matches()) {
            throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "PASSWORD_WEAK", "newPassword", MSG_PASSWORD_RULE);
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH", "confirmPassword",
                    MSG_CONFIRM_WRONG);
        }

        User user = userRepo.findById(request.username().trim())
                .orElseThrow(() -> new ForgotPasswordException(HttpStatus.BAD_REQUEST, "USERNAME_NOT_FOUND",
                        "username", MSG_USERNAME_WRONG));
        if (user.getStatus() == AccountStatus.LOCKED) {
            throw new ForgotPasswordException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", null, MSG_ACCOUNT_LOCKED);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepo.save(user);
        sessions.remove(key);
    }

    private User verifyAccount(String username, String email) {
        requireField(username, "username", "Vui lòng nhập tên tài khoản");
        requireField(email, "email", "Vui lòng nhập email");

        User user = userRepo.findById(username.trim()).orElseThrow(() ->
                new ForgotPasswordException(HttpStatus.BAD_REQUEST, "USERNAME_NOT_FOUND", "username",
                        MSG_USERNAME_WRONG));

        if (user.getEmail() == null || !user.getEmail().trim().equalsIgnoreCase(email.trim())) {
            throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "EMAIL_MISMATCH", "email",
                    MSG_EMAIL_WRONG);
        }
        if (user.getStatus() == AccountStatus.LOCKED) {
            throw new ForgotPasswordException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", null, MSG_ACCOUNT_LOCKED);
        }
        return user;
    }

    private OtpSentResponse issueOtp(User user, String key, Instant now) {
        purgeDeadSessions(now);

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        String email = user.getEmail().trim();
        ResetSession fresh = new ResetSession(email, sha256(otp),
                now.plus(Duration.ofMinutes(otpTtlMinutes)), now);

        ResetSession previous = sessions.put(key, fresh);
        try {
            otpMailService.sendOtp(email, user.getFullName(), otp, otpTtlMinutes);
        } catch (RuntimeException e) {
            sessions.remove(key, fresh);
            if (previous != null) {
                sessions.putIfAbsent(key, previous);
            }
            throw e;
        }
        return toResponse(fresh, now, "Mã OTP đã được gửi đến email của bạn");
    }

    private OtpSentResponse toResponse(ResetSession s, Instant now, String message) {
        long expiresIn = Math.max(0, Duration.between(now, s.otpExpiresAt).toSeconds());
        return new OtpSentResponse(message, maskEmail(s.email), expiresIn, s.cooldownSecondsLeft(now, cooldown()));
    }

    private void purgeDeadSessions(Instant now) {
        sessions.values().removeIf(s -> s.isDead(now));
    }

    private Duration cooldown() {
        return Duration.ofSeconds(resendCooldownSeconds);
    }

    private ForgotPasswordException otpExpired() {
        return new ForgotPasswordException(HttpStatus.GONE, "OTP_EXPIRED", "otp", MSG_OTP_EXPIRED).requireResend();
    }

    private ForgotPasswordException otpExceeded() {
        return new ForgotPasswordException(HttpStatus.TOO_MANY_REQUESTS, "OTP_ATTEMPTS_EXCEEDED", "otp",
                MSG_OTP_EXCEEDED).requireResend();
    }

    private void requireField(String value, String field, String message) {
        if (value == null || value.isBlank()) {
            throw new ForgotPasswordException(HttpStatus.BAD_REQUEST, "FIELD_REQUIRED", field, message);
        }
    }

    private String key(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String local = email.substring(0, at);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "***" + email.substring(at);
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static final class ResetSession {
        final String email;
        final Instant lastSentAt;
        byte[] otpHash;
        Instant otpExpiresAt;
        int failedAttempts;
        boolean exhausted;
        byte[] resetTokenHash;
        Instant resetTokenExpiresAt;

        ResetSession(String email, byte[] otpHash, Instant otpExpiresAt, Instant lastSentAt) {
            this.email = email;
            this.otpHash = otpHash;
            this.otpExpiresAt = otpExpiresAt;
            this.lastSentAt = lastSentAt;
        }

        synchronized boolean isCoolingDown(Instant now, Duration cooldown) {
            return otpHash != null && !exhausted
                    && now.isBefore(otpExpiresAt)
                    && now.isBefore(lastSentAt.plus(cooldown));
        }

        synchronized long cooldownSecondsLeft(Instant now, Duration cooldown) {
            long millis = Duration.between(now, lastSentAt.plus(cooldown)).toMillis();
            return millis > 0 ? (millis + 999) / 1000 : 0;
        }

        synchronized boolean hasValidResetToken(String token, Instant now) {
            return token != null && resetTokenHash != null && resetTokenExpiresAt != null
                    && now.isBefore(resetTokenExpiresAt)
                    && MessageDigest.isEqual(resetTokenHash, sha256(token));
        }

        synchronized boolean isDead(Instant now) {
            boolean otpDead = otpHash == null || now.isAfter(otpExpiresAt);
            boolean tokenDead = resetTokenHash == null || resetTokenExpiresAt == null
                    || now.isAfter(resetTokenExpiresAt);
            return otpDead && tokenDead;
        }
    }
}
