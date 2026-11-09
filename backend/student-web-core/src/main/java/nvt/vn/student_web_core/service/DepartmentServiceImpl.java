package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.Department;
import nvt.vn.student_web_core.payload.student.DepartmentSummaryResponse;
import nvt.vn.student_web_core.repository.DepartmentRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService{

    private final DepartmentRepo departmentRepo;

    @Override
    public List<DepartmentSummaryResponse> getAllDepartment() {
        List<Department> departments = departmentRepo.findAll();

        List<DepartmentSummaryResponse> responses = departments.stream()
                .map(
                        department -> {
                            DepartmentSummaryResponse depResponse = new DepartmentSummaryResponse();
                            depResponse.setDepartmentId(department.getDepartmentId());
                            depResponse.setDescription(department.getDescription());
                            depResponse.setEmail(department.getEmail());
                            depResponse.setPhone(department.getPhone());
                            depResponse.setLocation(department.getLocation());
                            depResponse.setName(department.getName());
                            depResponse.setDocumentCount(countToDocument());
                            depResponse.setExamCount(countToExam());
                            depResponse.setLogoUrl(department.getLogoUrl());
                            return depResponse;
                        }
                ).toList();

        return responses;
    }

    private long countToExam() {
        return departmentRepo.countByExam();
    }

    private long countToDocument(){
        return departmentRepo.countByDocument();
    }
}
