package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ScheduleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleEventRepo extends JpaRepository<ScheduleEvent, Integer> {

    List<ScheduleEvent> findByStudent_UserIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(String userId, LocalDate start, LocalDate localDateTime);
}
