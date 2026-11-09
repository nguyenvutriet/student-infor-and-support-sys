package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.StudyResource;
import nvt.vn.student_web_core.payload.student.StudyFileResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;
import nvt.vn.student_web_core.repository.StudyResourceRepo;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyServiceImpl implements StudyService{

    private final StudyResourceRepo studyResourceRepo;

    @Override
    public List<StudyResourceSummaryResponse> getHotResources(Integer limit) {

        Sort sort = Sort.by(Sort.Direction.DESC, "createAt");
        Pageable page = PageRequest.of(0, limit, sort);

        List<StudyResource> resources = studyResourceRepo.findAll(page).getContent();

        List<StudyResourceSummaryResponse> responses = resources.stream()
                .map(resource -> {

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
                }).toList();

        return responses;

    }
}
