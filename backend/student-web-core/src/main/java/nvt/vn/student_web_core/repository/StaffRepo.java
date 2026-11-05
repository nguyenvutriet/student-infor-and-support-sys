package nvt.vn.student_web_core.repository;

import nvt.vn.student_web_core.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepo extends JpaRepository<Staff, String> {
    List<Staff> findByDepartment_DepartmentId(String departmentId);
}
