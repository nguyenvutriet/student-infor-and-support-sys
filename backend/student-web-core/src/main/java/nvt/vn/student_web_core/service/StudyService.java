package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.model.ResourceType;
import nvt.vn.student_web_core.payload.student.ResourceSearchResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceDetailResponse;
import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;

import java.util.List;

public interface StudyService {

    List<StudyResourceSummaryResponse> getHotResources(Integer limit);

    ResourceSearchResponse lookupResourceByDepartment(String departmentId, ResourceType type, String keyword, int year);

    StudyResourceDetailResponse getResourceDetail(Integer resourceId);
}
