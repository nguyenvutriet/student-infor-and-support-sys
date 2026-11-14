package nvt.vn.student_web_core.handler;

import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ExceptionHandlerExceptionResolver;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email hoặc mật khẩu không hợp lệ, vui lòng thử lại"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"));
    }

    @ExceptionHandler(TooManyLoginAttemptsException.class)
    public ResponseEntity<Map<String, Object>> handleTooManyAttempts(TooManyLoginAttemptsException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", "Too Many Requests");
        body.put("message", ex.getMessage());
        body.put("retryAfterSeconds", ex.getRetryAfterSeconds());

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(body);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String,String>> notFound(ResourceNotFoundException e) {
        return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,String>> illegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String,String>> nullPointer(NullPointerException e) {
        return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(InvalidDataAccessApiUsageException.class)
    public ResponseEntity<Map<String,String>> invalidDataAccess(InvalidDataAccessApiUsageException e) {
        return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ForgotPasswordException.class)
    public ResponseEntity<Map<String, Object>> handleForgotPassword(ForgotPasswordException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ex.getStatus().value());
        body.put("code", ex.getCode());
        body.put("field", ex.getField());
        body.put("message", ex.getMessage());
        if (ex.getRetryAfterSeconds() != null) body.put("retryAfterSeconds", ex.getRetryAfterSeconds());
        if (ex.isRequireResend()) body.put("requireResend", true);
        if (ex.getAttemptsLeft() != null) body.put("attemptsLeft", ex.getAttemptsLeft());

        ResponseEntity.BodyBuilder res = ResponseEntity.status(ex.getStatus());
        if (ex.getRetryAfterSeconds() != null) {
            res.header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()));
        }
        return res.body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu gửi lên không hợp lệ"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> fallback(Exception e) {
        return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống, vui lòng thử lại sau"));
    }

}
