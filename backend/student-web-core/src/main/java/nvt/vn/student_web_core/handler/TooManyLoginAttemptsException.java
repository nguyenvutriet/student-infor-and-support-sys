package nvt.vn.student_web_core.handler;

import nvt.vn.student_web_core.service.LoginAttemptService;

public class TooManyLoginAttemptsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyLoginAttemptsException(long retryAfterSeconds) {
        super("Bạn đã nhập sai quá " + LoginAttemptService.MAX_ATTEMPTS
                + " lần. Vui lòng thử lại sau " + ((retryAfterSeconds + 59) / 60) + " phút.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
