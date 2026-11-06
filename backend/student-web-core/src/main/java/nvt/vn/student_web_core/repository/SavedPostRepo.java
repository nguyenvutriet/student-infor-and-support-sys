package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedPostRepo extends JpaRepository<SavedPost, Integer> {
    
    boolean existsByUser_UserIdAndForumPost_PostId(String currentUserId, Integer postId);

    SavedPost findByUser_UserIdAndForumPost_PostId(String userId, Integer postId);

    Page<SavedPost> findByUser_UserId(String userId, Pageable pageable);
}
