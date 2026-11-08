package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.model.NotificationType;
import nvt.vn.student_web_core.payload.NotificationDTO;
import nvt.vn.student_web_core.payload.NotificationResponse;
import nvt.vn.student_web_core.payload.UnreadCountResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;

public interface NotificationService {

    @Transactional(readOnly = true)
    NotificationResponse getAllNotification(String keyword, Integer pageNumber, Integer pageSize, String userId);

    NotificationDTO markToReaded(Integer notiId, String userId);

    UnreadCountResponse getUnreadCount(String userId);

    void send(String userId, NotificationType type, String content);

    void sendToMany(Collection<String> userIds, NotificationType type, String content);

    void sendToAll(NotificationType type, String content);


}
