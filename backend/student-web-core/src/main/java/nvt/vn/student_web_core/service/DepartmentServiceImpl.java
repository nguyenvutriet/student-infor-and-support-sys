package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.handler.GlobalExceptionHandler;
import nvt.vn.student_web_core.handler.ResourceNotFoundException;
import nvt.vn.student_web_core.model.Department;
import nvt.vn.student_web_core.model.StudyResource;
import nvt.vn.student_web_core.payload.student.DepartmentDetailResponse;
import nvt.vn.student_web_core.payload.student.DepartmentSummaryResponse;
import nvt.vn.student_web_core.payload.student.StudyFileResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;
import nvt.vn.student_web_core.repository.DepartmentRepo;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Comparator;
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

    @Override
    public DepartmentDetailResponse findDepartment(String departmentId) {

        Department department = departmentRepo.findById(departmentId).orElseThrow(
                () -> new ResourceNotFoundException("Không tìm thấy phòng bang")
        );

        List<StudyResourceSummaryResponse> resources = department.getHeadOfDepartment().getStudyResources().stream()
                .sorted(Comparator.comparing(
                        StudyResource::getCreateAt
                ).reversed())
                .limit(6)
                .map(
                        resource -> {
                            StudyResourceSummaryResponse resourceResponse = new StudyResourceSummaryResponse();
                            resourceResponse.setResourceId(resource.getResourceId());
                            resourceResponse.setTitle(resource.getTitle());
                            resourceResponse.setDescription(resource.getDescription());
                            resourceResponse.setCreateAt(resource.getCreateAt());
                            resourceResponse.setDepartmentId(resource.getStaff().getDepartment().getDepartmentId());
                            resourceResponse.setDepartmentName(resource.getStaff().getDepartment().getName());
                            resourceResponse.setFiles(resource.getFiles().stream().map(
                                    file -> {
                                        StudyFileResponse fileResponse = new StudyFileResponse();
                                        fileResponse.setFileId(file.getFileId());
                                        fileResponse.setFileName(file.getFileName());
                                        fileResponse.setFileType(file.getFileType());
                                        fileResponse.setFileSize(file.getFileSize());
                                        fileResponse.setFileUrl(file.getFileUrl());
                                        return fileResponse;
                                    }
                            ).toList());

                            return resourceResponse;
                        }
                ).toList();

        DepartmentDetailResponse response = new DepartmentDetailResponse();
        response.setDepartmentId(departmentId);
        response.setDescription(department.getDescription());
        response.setEmail(department.getEmail());
        response.setName(department.getName());
        response.setPhone(department.getPhone());
        response.setLocation(department.getLocation());
        response.setLogoUrl(department.getLogoUrl());
        response.setDocumentCount(countToDocument());
        response.setExamCount(countToExam());
        response.setRecentResources(resources);

        return response;
    }

    private long countToExam() {
        return departmentRepo.countByExam();
    }

    private long countToDocument(){
        return departmentRepo.countByDocument();
    }
}
