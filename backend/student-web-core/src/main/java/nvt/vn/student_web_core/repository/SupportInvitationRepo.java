package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.SupportInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportInvitationRepo extends JpaRepository<SupportInvitation, Integer> {

    List<SupportInvitation> findByRequest_RequestId(Integer requestId);

    Optional<SupportInvitation> findByRequest_RequestIdAndDepartment_DepartmentId(Integer requestId, String departmentId);

    boolean existsByRequest_RequestIdAndDepartment_DepartmentId(Integer requestId, String departmentId);
}
