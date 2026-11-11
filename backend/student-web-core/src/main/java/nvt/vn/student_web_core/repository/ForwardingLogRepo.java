package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ForwardingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ForwardingLogRepo extends JpaRepository<ForwardingLog, Integer> {

    List<ForwardingLog> findByRequest_RequestIdOrderByForwardAtDescForwardIdDesc(Integer requestId);

    @Query("SELECT f.request.requestId, f.forwardAt FROM ForwardingLog f WHERE f.forwardTo.departmentId = :deptId AND f.forwardAt BETWEEN :from AND :to")
    List<Object[]> forwardedTo(@Param("deptId") String deptId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(f) FROM ForwardingLog f WHERE f.receiveFrom.departmentId = :deptId AND f.forwardAt BETWEEN :from AND :to")
    long countForwardedFrom(@Param("deptId") String deptId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}