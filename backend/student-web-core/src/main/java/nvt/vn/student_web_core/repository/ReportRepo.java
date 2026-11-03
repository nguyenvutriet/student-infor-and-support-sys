
package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepo extends JpaRepository<Report, Integer> {
    @Query("""
        SELECT r FROM Report r
        JOIN FETCH r.comment c
        LEFT JOIN FETCH c.user
        LEFT JOIN FETCH c.forumPost
        LEFT JOIN FETCH r.student
        LEFT JOIN FETCH r.handledBy
        WHERE r.comment IS NOT NULL
        ORDER BY r.createAt DESC
    """)
    List<Report> findAllCommentReports();

    // Tìm chi tiết báo cáo bình luận
    @Query("""
        SELECT r FROM Report r
        JOIN FETCH r.comment c
        LEFT JOIN FETCH c.user
        LEFT JOIN FETCH c.forumPost
        LEFT JOIN FETCH r.student
        LEFT JOIN FETCH r.handledBy
        WHERE r.reportId = :reportId
        AND r.comment IS NOT NULL
    """)
    Optional<Report> findCommentReportById(
            @Param("reportId") Integer reportId
    );

    // Thống kê
    @Query("""
        SELECT COUNT(r) FROM Report r
        WHERE r.comment IS NOT NULL
    """)
    long countCommentReports();

    @Query("""
        SELECT COUNT(r) FROM Report r
        WHERE r.comment IS NOT NULL
        AND r.isResolved = false
    """)
    long countPendingCommentReports();

    @Query("""
        SELECT COUNT(r) FROM Report r
        WHERE r.comment IS NOT NULL
        AND r.isResolved = true
    """)
    long countResolvedCommentReports();

    @Query("""
    SELECT r FROM Report r
    JOIN FETCH r.forumPost p
    LEFT JOIN FETCH p.author
    LEFT JOIN FETCH r.student
    LEFT JOIN FETCH r.handledBy
    WHERE r.forumPost IS NOT NULL
    AND r.comment IS NULL
    ORDER BY r.createAt DESC
""")
    List<Report> findAllPostReports();

    @Query("""
    SELECT COUNT(r) FROM Report r
    WHERE r.forumPost IS NOT NULL
    AND r.comment IS NULL
""")
    long countPostReports();

    @Query("""
    SELECT COUNT(r) FROM Report r
    WHERE r.forumPost IS NOT NULL
    AND r.comment IS NULL
    AND r.isResolved = false
""")
    long countPendingPostReports();


    @Query("""
    SELECT COUNT(r) FROM Report r
    WHERE r.forumPost IS NOT NULL
    AND r.comment IS NULL
    AND r.isResolved = true
""")
    long countResolvedPostReports();

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

    long countByIsResolvedTrue();

    long countByIsResolvedFalse();

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.isResolved = true
""")
    long countResolved();

    @Query("""
    SELECT COUNT(r)
    FROM Report r
    WHERE r.isResolved = false
""")
    long countPending();
}
