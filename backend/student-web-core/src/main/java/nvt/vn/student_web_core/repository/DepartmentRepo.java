package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepo extends JpaRepository<Department, String> {

    @Query("SELECT COUNT(e) FROM StudyResource e WHERE e.resourceType = 'EXAM'")
    long countByExam();


    @Query("SELECT COUNT(e) FROM StudyResource e WHERE e.resourceType = 'DOCUMENT'")
    long countByDocument();
}
