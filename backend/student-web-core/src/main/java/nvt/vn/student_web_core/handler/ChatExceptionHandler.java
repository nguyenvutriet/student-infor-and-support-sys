package nvt.vn.student_web_core.handler;

import nvt.vn.student_web_core.controller.common.ChatController;
import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.PersistenceException;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.TransactionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

/** Trả lỗi dạng { "message": "..." } cho ChatController. */
@Slf4j
@RestControllerAdvice(assignableTypes = ChatController.class)
public class ChatExceptionHandler {

    @ExceptionHandler(ChatException.class)
    public ResponseEntity<Map<String, String>> chat(ChatException e) {
        return body(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tooLarge(MaxUploadSizeExceededException e) {
        return body(HttpStatus.PAYLOAD_TOO_LARGE, "Tệp vượt quá dung lượng cho phép");
    }

    @ExceptionHandler({DataAccessException.class, TransactionException.class, PersistenceException.class})
    public ResponseEntity<Map<String, String>> db(Exception e) {
        log.error("Lỗi cơ sở dữ liệu khi xử lý nhắn tin", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi cơ sở dữ liệu, vui lòng thử lại");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> server(IllegalStateException e) {
        return body(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }

    private ResponseEntity<Map<String, String>> body(HttpStatus s, String m) {
        return ResponseEntity.status(s).body(Map.of("message", m == null ? "Có lỗi xảy ra" : m));
    }
}
