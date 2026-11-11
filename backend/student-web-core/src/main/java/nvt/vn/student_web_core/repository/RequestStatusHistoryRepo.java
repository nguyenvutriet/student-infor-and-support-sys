package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface RequestStatusHistoryRepo extends JpaRepository<RequestStatusHistory, Integer> {

    List<RequestStatusHistory> findByRequest_RequestIdOrderByCreateAtDescHistoryIdDesc(Integer requestId);

    boolean existsByRequest_RequestIdAndStatus(Integer requestId, nvt.vn.student_web_core.model.RequestStatus status);

    @Query("SELECT DISTINCT h.request.requestId FROM RequestStatusHistory h WHERE h.request.requestId IN :ids AND h.status = nvt.vn.student_web_core.model.RequestStatus.ACCEPTED")
    List<Integer> findAcceptedRequestIds(@Param("ids") List<Integer> ids);

    @Query("SELECT h.request.requestId, MAX(h.createAt) FROM RequestStatusHistory h WHERE h.request.requestId IN :ids GROUP BY h.request.requestId")
    List<Object[]> lastHistoryTimes(@Param("ids") List<Integer> ids);

    @Query("SELECT h.request.requestId, h.createAt FROM RequestStatusHistory h WHERE h.action = :action AND h.departmentName = :deptName AND h.createAt BETWEEN :from AND :to")
    List<Object[]> requestsCreatedTo(@Param("action") String action, @Param("deptName") String deptName,
                                     @Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    @Query("SELECT h FROM RequestStatusHistory h WHERE h.action = :action AND h.departmentName = :deptName AND h.createAt BETWEEN :from AND :to")
    List<RequestStatusHistory> findByActionAndDepartment(@Param("action") String action, @Param("deptName") String deptName,
                                                         @Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    List<RequestStatusHistory> findByRequest_RequestIdIn(Collection<Integer> requestIds);
}