package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import nvt.vn.student_web_core.model.ViewStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ForumPostRepo extends JpaRepository<ForumPost, Integer>, JpaSpecificationExecutor<ForumPost> {

    @Query("""
        SELECT COUNT(p)
        FROM ForumPost p
        WHERE p.createAt BETWEEN :from AND :to
    """)
    long countCreatedBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COUNT(p)
        FROM ForumPost p
        WHERE p.createAt BETWEEN :from AND :to
        AND p.status = :status
    """)
    long countByStatusBetween(
            @Param("status") ViewStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT p.status, COUNT(p)
    FROM ForumPost p
    GROUP BY p.status
""")
    List<Object[]> countAllByStatus();

    @Query(value = """
    SELECT DATE_FORMAT(createAt, '%Y-%m') AS month,
           COUNT(*) AS total
    FROM forum_posts
    GROUP BY DATE_FORMAT(createAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyPosts();

    @Query("""
    SELECT p.status, COUNT(p)
    FROM ForumPost p
    WHERE p.createAt BETWEEN :from AND :to
    GROUP BY p.status
""")
    List<Object[]> countByStatusBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query(value = """
    SELECT DATE_FORMAT(createAt, '%Y-%m') AS month, COUNT(*) AS total
    FROM forum_posts
    WHERE createAt BETWEEN :from AND :to
    GROUP BY DATE_FORMAT(createAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyPostsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
