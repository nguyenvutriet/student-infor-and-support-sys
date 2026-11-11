package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.handler.ResourceNotFoundException;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.student.ResourceSearchResponse;
import nvt.vn.student_web_core.payload.student.StudyFileResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceDetailResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;
import nvt.vn.student_web_core.repository.DepartmentRepo;
import nvt.vn.student_web_core.repository.StudyResourceRepo;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyServiceImpl implements StudyService{

    private final StudyResourceRepo studyResourceRepo;
    private final DepartmentRepo departmentRepo;

    @Override
    public List<StudyResourceSummaryResponse> getHotResources(Integer limit) {

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");
        Pageable page = PageRequest.of(0, limit, sort);

        List<StudyResource> resources = studyResourceRepo.findAll(page).getContent();

        List<StudyResourceSummaryResponse> responses = resources.stream()
                .map(resource -> {

                    if(resource.getStatus() == ViewStatus.VISIBLE){
                        List<StudyFileResponse> files = resource.getFiles().stream().map(
                                file ->  {
                                    StudyFileResponse fileResponse = new StudyFileResponse();
                                    fileResponse.setFileId(file.getFileId());
                                    fileResponse.setFileName(file.getFileName());
                                    fileResponse.setFileType(file.getFileType());
                                    fileResponse.setFileSize(file.getFileSize());
                                    fileResponse.setFileUrl(file.getFileUrl());
                                    return fileResponse;
                                }
                        ).toList();

                        StudyResourceSummaryResponse response = new StudyResourceSummaryResponse();
                        response.setTitle(resource.getTitle());
                        response.setResourceId(response.getResourceId());
                        response.setDescription(resource.getDescription());
                        response.setCreateAt(resource.getCreateAt());
                        response.isNew();
                        response.setDepartmentId(resource.getStaff().getDepartment().getDepartmentId());
                        response.setDepartmentName(resource.getStaff().getDepartment().getName());
                        response.setFiles(files);

                        return response;
                    }
                    return null;

                }).toList();

        return responses;

    }

    @Override
    @Transactional(readOnly = true)
    public ResourceSearchResponse lookupResourceByDepartment(String departmentId, ResourceType type, String keyword, int year) {

        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Loại tài liệu không hợp lệ (EXAM hoặc DOCUMENT)");
        }

        if (!departmentRepo.existsById(departmentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Khoa/viện không tồn tại");
        }

        String kw = keyword == null ? "" : keyword.trim();
        Integer yearFilter = year > 0 ? year : null;
        List<StudyResourceSummaryResponse> items = studyResourceRepo
                .search(ViewStatus.VISIBLE, departmentId, type, kw, yearFilter)
                .stream()
                .map(r -> toSummary((StudyResource) r))
                .toList();

        List<Integer> availableYears =
                studyResourceRepo.findYears(ViewStatus.VISIBLE, departmentId, type);

        ResourceSearchResponse response = new ResourceSearchResponse();
        response.setItems(items);
        response.setAvailableYears(availableYears);

        return response;
    }

    @Override
    public StudyResourceDetailResponse getResourceDetail(Integer resourceId) {

        StudyResource  resource = studyResourceRepo.findById(resourceId).orElseThrow(
                () -> new ResourceNotFoundException("Không tìm thấy tài liệu" + resourceId)
        );

        if(resource.getStatus() == ViewStatus.HIDDEN) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại");
        }

        List<FileAttachment> files = resource.getFiles();
        List<StudyFileResponse> fileResponses = files.stream()
                .map(
                        file -> {
                            StudyFileResponse fileResponse = new StudyFileResponse();
                            fileResponse.setFileId(file.getFileId());
                            fileResponse.setFileName(file.getFileName());
                            fileResponse.setFileType(file.getFileType());
                            fileResponse.setFileSize(file.getFileSize());
                            fileResponse.setFileUrl(file.getFileUrl());
                            return fileResponse;
                        }
                ).toList();

        StudyResourceDetailResponse response = new StudyResourceDetailResponse();
        response.setResourceId(resource.getResourceId());
        response.setTitle(resource.getTitle());
        response.setDescription(resource.getDescription());
        response.setCreateAt(resource.getCreateAt());
        response.setDepartmentId(resource.getStaff().getDepartment().getDepartmentId());
        response.setDepartmentName(resource.getStaff().getDepartment().getName());
        response.setFiles(fileResponses);

        return response;
    }

    private StudyResourceSummaryResponse toSummary(StudyResource r) {
        Department dept = r.getStaff().getDepartment();

        List<StudyFileResponse> files = r.getFiles() == null ? List.of()
                : r.getFiles().stream()
                .map(f -> {
                    StudyFileResponse fileResponse = new StudyFileResponse();
                    fileResponse.setFileId(f.getFileId());
                    fileResponse.setFileName(f.getFileName());
                    fileResponse.setFileType(f.getFileType());
                    fileResponse.setFileSize(f.getFileSize());
                    fileResponse.setFileUrl(f.getFileUrl());
                    return fileResponse;
                })
                .toList();

        boolean isNew = r.getCreateAt() != null
                && r.getCreateAt().isAfter(LocalDateTime.now().minusDays(7));

        StudyResourceSummaryResponse response = new StudyResourceSummaryResponse();
        response.setResourceId(r.getResourceId());
        response.setTitle(r.getTitle());
        response.setDescription(r.getDescription());
        response.setCreateAt(r.getCreateAt());
        response.setNew(isNew);
        response.setDepartmentId(dept.getDepartmentId());
        response.setDepartmentName(dept.getName());
        response.setFiles(files);

        return response;
    }
}
