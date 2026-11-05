package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface RequestStatusHistoryRepo extends JpaRepository<RequestStatusHistory, Integer> {

    List<RequestStatusHistory> findByRequest_RequestIdOrderByCreateAtDescHistoryIdDesc(Integer requestId);

    /** Yêu cầu đã từng được tiếp nhận (có lịch sử ở trạng thái ACCEPTED) hay chưa. */
    boolean existsByRequest_RequestIdAndStatus(Integer requestId, nvt.vn.student_web_core.model.RequestStatus status);

    /** Các requestId (trong danh sách) đã từng được tiếp nhận. */
    @Query("SELECT DISTINCT h.request.requestId FROM RequestStatusHistory h WHERE h.request.requestId IN :ids AND h.status = nvt.vn.student_web_core.model.RequestStatus.ACCEPTED")
    List<Integer> findAcceptedRequestIds(@Param("ids") List<Integer> ids);

    /** [requestId, thời điểm lịch sử cuối] */
    @Query("SELECT h.request.requestId, MAX(h.createAt) FROM RequestStatusHistory h WHERE h.request.requestId IN :ids GROUP BY h.request.requestId")
    List<Object[]> lastHistoryTimes(@Param("ids") List<Integer> ids);
}