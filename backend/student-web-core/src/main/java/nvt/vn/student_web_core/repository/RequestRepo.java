package nvt.vn.student_web_core.repository;

import jakarta.persistence.LockModeType;
import nvt.vn.student_web_core.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import nvt.vn.student_web_core.model.RequestStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepo extends JpaRepository<Request, Integer> {

    @Query("""
        SELECT COUNT(r)
        FROM Request r
        WHERE r.createdAt BETWEEN :from AND :to
        AND r.isDeleted = false
    """)
    long countCreatedBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COUNT(r)
        FROM Request r
        WHERE r.createdAt BETWEEN :from AND :to
        AND r.isDeleted = false
        AND r.status = :status
    """)
    long countByStatusBetween(
            @Param("status") RequestStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COUNT(r)
        FROM Request r
        WHERE r.createdAt BETWEEN :from AND :to
        AND r.isDeleted = false
        AND r.toDepartment.departmentId = :departmentId
    """)
    long countByDepartmentBetween(
            @Param("departmentId") String departmentId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.forumPost IS NOT NULL
    AND r.comment IS NULL
    AND r.createAt BETWEEN :from AND :to
""")
    long countPostReportsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.comment IS NOT NULL
    AND r.createAt BETWEEN :from AND :to
""")
    long countCommentReportsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.isResolved = true
    AND r.createAt BETWEEN :from AND :to
""")
    long countResolvedBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.isResolved = false
    AND r.createAt BETWEEN :from AND :to
""")
    long countPendingBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT r.status, COUNT(r)
    FROM Request r
    WHERE r.isDeleted = false
    GROUP BY r.status
""")
    List<Object[]> countAllByStatus();

    @Query(value = """
    SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
           COUNT(*) AS total
    FROM requests
    WHERE isDeleted = false
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyRequests();

    @Query("""
    SELECT r.toDepartment.name, COUNT(r)
    FROM Request r
    WHERE r.isDeleted = false
    GROUP BY r.toDepartment.name
    ORDER BY COUNT(r) DESC
""")
    List<Object[]> countAllByDepartment();

    @Query("""
    SELECT r.toDepartment.name, COUNT(r)
    FROM Request r
    WHERE r.isDeleted = false
      AND r.createdAt BETWEEN :from AND :to
    GROUP BY r.toDepartment.name
    ORDER BY COUNT(r) DESC
""")
    List<Object[]> countByDepartmentBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT r.status, COUNT(r)
    FROM Request r
    WHERE r.isDeleted = false
      AND r.createdAt BETWEEN :from AND :to
    GROUP BY r.status
""")
    List<Object[]> countByStatusBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query(value = """
    SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS total
    FROM requests
    WHERE createdAt BETWEEN :from AND :to
      AND isDeleted = false
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyRequestsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    // ===================== Nhắn tin / yêu cầu hỗ trợ =====================
    /** Yêu cầu hiện đang gửi tới đơn vị, tạo từ thời điểm :from (dùng cho biểu đồ tổng quan). */
    @Query("SELECT r FROM Request r WHERE r.isDeleted = false AND r.toDepartment.departmentId = :deptId AND r.createdAt >= :from")
    List<Request> findByDepartmentCreatedSince(@Param("deptId") String deptId, @Param("from") LocalDateTime from);

    /** Khóa dòng khi đổi trạng thái để tránh hai nhân viên cùng tiếp nhận / sinh viên xóa lúc đang xử lý. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Request r WHERE r.requestId = :id")
    Optional<Request> findByIdForUpdate(@Param("id") Integer id);

    /** Sinh viên: chỉ thấy yêu cầu do mình tạo. */
    @Query("""
        SELECT r FROM Request r
        JOIN FETCH r.student s
        LEFT JOIN FETCH r.toDepartment d
        WHERE r.isDeleted = false
          AND s.userId = :studentId
          AND r.status IN :statuses
          AND LOWER(r.subject) LIKE :kw
        ORDER BY r.requestId DESC
    """)
    List<Request> searchForStudent(@Param("studentId") String studentId,
                                   @Param("statuses") List<RequestStatus> statuses,
                                   @Param("kw") String kw);

    /**
     * Nhân viên - tab "Tiếp nhận yêu cầu":
     *  - yêu cầu chờ tiếp nhận của đơn vị mình (kể cả yêu cầu được chuyển tiếp / trả về lại cho đơn vị mình);
     *  - yêu cầu đang xử lý mà đơn vị mình được mời hỗ trợ nhưng CHƯA bấm tiếp nhận.
     */
    @Query("""
        SELECT r FROM Request r
        JOIN FETCH r.student s
        LEFT JOIN FETCH r.toDepartment d
        WHERE r.isDeleted = false
          AND (LOWER(r.subject) LIKE :kw OR LOWER(s.fullName) LIKE :kw OR LOWER(s.userId) LIKE :kw)
          AND (
                (d.departmentId = :deptId
                  AND r.status = nvt.vn.student_web_core.model.RequestStatus.PENDING)
                OR (r.status = nvt.vn.student_web_core.model.RequestStatus.ACCEPTED
                  AND EXISTS (SELECT si.inviteId FROM SupportInvitation si
                              WHERE si.request = r AND si.department.departmentId = :deptId AND si.accepted = false))
          )
        ORDER BY r.requestId DESC
    """)
    List<Request> searchPendingForDepartment(@Param("deptId") String deptId,
                                             @Param("kw") String kw);

    /** Nhân viên - tab "Nhắn tin": mọi yêu cầu đơn vị mình đã tiếp nhận (hoặc đã tham gia hỗ trợ), không trùng tab kia. */
    @Query("""
        SELECT r FROM Request r
        JOIN FETCH r.student s
        LEFT JOIN FETCH r.toDepartment d
        WHERE r.isDeleted = false
          AND r.status IN :statuses
          AND (LOWER(r.subject) LIKE :kw OR LOWER(s.fullName) LIKE :kw OR LOWER(s.userId) LIKE :kw)
          AND (
                (d.departmentId = :deptId
                  AND r.status <> nvt.vn.student_web_core.model.RequestStatus.PENDING)
                OR EXISTS (SELECT si.inviteId FROM SupportInvitation si
                           WHERE si.request = r AND si.department.departmentId = :deptId
                             AND (si.accepted = true OR r.status <> nvt.vn.student_web_core.model.RequestStatus.ACCEPTED))
          )
          AND NOT (d.departmentId = :deptId AND r.status = nvt.vn.student_web_core.model.RequestStatus.PENDING)
        ORDER BY r.requestId DESC
    """)
    List<Request> searchConversationsForDepartment(@Param("deptId") String deptId,
                                                   @Param("statuses") List<RequestStatus> statuses,
                                                   @Param("kw") String kw);
}
