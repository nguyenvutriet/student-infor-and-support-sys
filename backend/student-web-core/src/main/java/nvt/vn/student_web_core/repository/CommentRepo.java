package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepo extends JpaRepository<Comment, Integer> {

    @Query("""
        SELECT COUNT(c)
        FROM Comment c
        WHERE c.createAt BETWEEN :from AND :to
    """)
    long countCreatedBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT COUNT(c)
        FROM Comment c
        WHERE c.createAt BETWEEN :from AND :to
        AND c.isActive = true
    """)
    long countActiveBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query(value = """
    SELECT DATE_FORMAT(createAt, '%Y-%m') AS month,
           COUNT(*) AS total
    FROM comments
    GROUP BY DATE_FORMAT(createAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyComments();

    long countByIsActiveTrue();

    @Query(value = """
    SELECT DATE_FORMAT(createAt, '%Y-%m') AS month, COUNT(*) AS total
    FROM comments
    WHERE createAt BETWEEN :from AND :to
    GROUP BY DATE_FORMAT(createAt, '%Y-%m')
    ORDER BY month
""", nativeQuery = true)
    List<Object[]> countMonthlyCommentsBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
