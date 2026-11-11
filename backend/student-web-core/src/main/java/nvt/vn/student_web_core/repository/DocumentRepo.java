package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Document;
import nvt.vn.student_web_core.model.ViewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepo extends JpaRepository<Document, Integer> {
    @Query("""
        SELECT d FROM Document d
        WHERE d.department.departmentId = :departmentId
        ORDER BY d.createAt DESC
    """)
    List<Document> findAllByDepartment(@Param("departmentId") String departmentId);

    @Query("""
        SELECT d FROM Document d
        WHERE d.department.departmentId = :departmentId
          AND d.status = :status
        ORDER BY d.createAt DESC
    """)
    List<Document> findAllByDepartmentAndStatus(
            @Param("departmentId") String departmentId,
            @Param("status") ViewStatus status
    );

    @Query("""
        SELECT d FROM Document d
        WHERE d.department.departmentId = :departmentId
          AND d.status = :status
          AND LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%'))
        ORDER BY d.createAt DESC
    """)
    List<Document> searchByDepartmentAndStatus(
            @Param("departmentId") String departmentId,
            @Param("status") ViewStatus status,
            @Param("title") String title
    );

    @Query("""
        SELECT d FROM Document d
        WHERE d.department.departmentId = :departmentId
          AND LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%'))
        ORDER BY d.createAt DESC
    """)
    List<Document> searchByDepartment(
            @Param("departmentId") String departmentId,
            @Param("title") String title
    );
    boolean existsByDocNumberIgnoreCase(String docNumber);
    boolean existsByDocNumberIgnoreCaseAndDocIdNot(String docNumber, Integer docId);

    @Query("SELECT d.status, COUNT(d) FROM Document d WHERE d.department.departmentId = :deptId GROUP BY d.status")
    List<Object[]> countByStatusForDepartment(@Param("deptId") String deptId);

    @Query("""
        SELECT d FROM Document d
        WHERE d.department.departmentId = :deptId AND d.createAt BETWEEN :from AND :to
        ORDER BY d.createAt DESC
    """)
    List<Document> findByDepartmentCreatedBetween(@Param("deptId") String deptId,
                                                  @Param("from") java.time.LocalDateTime from,
                                                  @Param("to") java.time.LocalDateTime to);
}
