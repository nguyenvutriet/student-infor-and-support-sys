package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.StudyResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyResourceRepo extends JpaRepository<StudyResource, Integer> {
}
