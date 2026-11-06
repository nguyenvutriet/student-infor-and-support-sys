package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ForwardingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForwardingLogRepo extends JpaRepository<ForwardingLog, Integer> {

    List<ForwardingLog> findByRequest_RequestIdOrderByForwardAtDescForwardIdDesc(Integer requestId);
}