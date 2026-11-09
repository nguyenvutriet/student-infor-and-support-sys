package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.util.List;

@Data
public class DepartmentDetailResponse {

    private List<StudyResourceSummaryResponse> recentResources;

}
