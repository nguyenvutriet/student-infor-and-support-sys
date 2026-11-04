package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.StudyResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyResourceRepo extends JpaRepository<StudyResource, Integer> {
    @Query("""
        SELECT r FROM StudyResource r
        WHERE r.staff.userId = :staffId
        ORDER BY r.createAt DESC
    """)
    List<StudyResource> findAllByStaff(@Param("staffId") String staffId);
}
