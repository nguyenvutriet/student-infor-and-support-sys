package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import nvt.vn.student_web_core.model.RequestStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.List;

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
}
