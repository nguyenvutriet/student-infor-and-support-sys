package nvt.vn.student_web_core.handler;

import org.springframework.http.HttpStatus;

public class ChatException extends RuntimeException {
    private final HttpStatus status;

    public ChatException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }

    public static ChatException badRequest(String m) { return new ChatException(HttpStatus.BAD_REQUEST, m); }
    public static ChatException forbidden(String m) { return new ChatException(HttpStatus.FORBIDDEN, m); }
    public static ChatException notFound(String m) { return new ChatException(HttpStatus.NOT_FOUND, m); }
    public static ChatException conflict(String m) { return new ChatException(HttpStatus.CONFLICT, m); }
}
