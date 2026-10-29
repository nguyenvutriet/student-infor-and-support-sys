package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ForwardingLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForwardingLogRepo extends JpaRepository<ForwardingLog, Integer> {
}
