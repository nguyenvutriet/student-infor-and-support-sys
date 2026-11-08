package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Notification;
import nvt.vn.student_web_core.payload.NotificationDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepo extends JpaRepository<Notification, Integer>, JpaSpecificationExecutor<Notification> {

    Notification findByNotiIdAndUser_UserId(Integer notiId, String userId);

    long countByUser_UserIdAndIsReadFalse(String userId);
}
