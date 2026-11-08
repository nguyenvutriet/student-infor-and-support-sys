package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.NotificationDTO;
import nvt.vn.student_web_core.payload.NotificationResponse;
import nvt.vn.student_web_core.payload.UnreadCountResponse;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationService {

    @Transactional(readOnly = true)
    NotificationResponse getAllNotification(String keyword, Integer pageNumber, Integer pageSize, String userId);

    NotificationDTO markToReaded(Integer notiId, String userId);

    UnreadCountResponse getUnreadCount(String userId);
}
