package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestStatusHistoryRepo extends JpaRepository<RequestStatusHistory, Integer> {
}
