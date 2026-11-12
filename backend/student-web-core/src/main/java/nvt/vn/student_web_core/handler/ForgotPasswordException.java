package nvt.vn.student_web_core.handler;

import org.springframework.http.HttpStatus;

public class ForgotPasswordException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String field;
    private Long retryAfterSeconds;
    private boolean requireResend;
    private Integer attemptsLeft;

    public ForgotPasswordException(HttpStatus status, String code, String field, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.field = field;
    }

    public ForgotPasswordException retryAfter(long seconds) {
        this.retryAfterSeconds = seconds;
        return this;
    }

    public ForgotPasswordException requireResend() {
        this.requireResend = true;
        return this;
    }

    public ForgotPasswordException attemptsLeft(int attemptsLeft) {
        this.attemptsLeft = attemptsLeft;
        return this;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getField() {
        return field;
    }

    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public boolean isRequireResend() {
        return requireResend;
    }

    public Integer getAttemptsLeft() {
        return attemptsLeft;
    }
}
