package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.ResourceType;
import nvt.vn.student_web_core.model.StudyResource;
import nvt.vn.student_web_core.model.ViewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface StudyResourceRepo extends JpaRepository<StudyResource, Integer> {
    @Query("""
        SELECT r FROM StudyResource r
        WHERE r.staff.userId = :staffId
        ORDER BY r.createAt DESC
    """)
    List<StudyResource> findAllByStaff(@Param("staffId") String staffId);

    @Query("""
      SELECT r FROM StudyResource r
      WHERE r.status = :visible
        AND r.staff.department.departmentId = :deptId
        AND r.resourceType = :type
        AND (:year IS NULL OR FUNCTION('YEAR', r.createAt) = :year)
        AND (:kw = '' OR LOWER(r.title) LIKE LOWER(CONCAT('%', :kw, '%'))
                      OR LOWER(r.description) LIKE LOWER(CONCAT('%', :kw, '%')))
      ORDER BY r.createAt DESC""")
    Collection<Object> search(@Param("visible") ViewStatus viewStatus,@Param("deptId") String departmentId,@Param("type") ResourceType type,@Param("kw") String kw,@Param(("year")) Integer yearFilter);

    @Query("""
      SELECT DISTINCT FUNCTION('YEAR', r.createAt) FROM StudyResource r
      WHERE r.status = :visible
        AND r.staff.department.departmentId = :deptId
        AND r.resourceType = :type
      ORDER BY 1 DESC""")
    List<Integer> findYears(@Param("visible") ViewStatus viewStatus,@Param("deptId") String departmentId,@Param("type") ResourceType type);

    @Query("""
        SELECT r.resourceType, r.status, COUNT(r) FROM StudyResource r
        WHERE r.staff.department.departmentId = :deptId
        GROUP BY r.resourceType, r.status
    """)
    List<Object[]> countByDepartment(@Param("deptId") String deptId);

    @Query("""
        SELECT r FROM StudyResource r
        WHERE r.staff.department.departmentId = :deptId AND r.createAt BETWEEN :from AND :to
        ORDER BY r.createAt DESC
    """)
    List<StudyResource> findByDepartmentCreatedBetween(
            @Param("deptId") String deptId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
