package nvt.vn.student_web_core.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import nvt.vn.student_web_core.model.NotificationType;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationDTO {

    private Integer notiId;
    private String content;
    private NotificationType type;
    private boolean read;
    private LocalDateTime createAt;

}
