package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoteRepo extends JpaRepository<Vote, Integer> {
}
