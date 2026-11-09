package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.student.StudyResourceSummaryResponse;

import java.util.List;

public interface StudyService {

    List<StudyResourceSummaryResponse> getHotResources(Integer limit);
}
