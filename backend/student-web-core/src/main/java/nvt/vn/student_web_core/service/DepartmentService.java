package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.student.DepartmentSummaryResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentSummaryResponse> getAllDepartment();
}
