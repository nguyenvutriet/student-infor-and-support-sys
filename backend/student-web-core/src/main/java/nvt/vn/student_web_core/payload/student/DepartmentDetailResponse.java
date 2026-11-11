package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.util.List;

@Data
public class DepartmentDetailResponse {

    private String departmentId;
    private String name;
    private String description;
    private String email;
    private String phone;
    private String location;
    private String logoUrl;
    private long examCount;
    private long documentCount;
    private List<StudyResourceSummaryResponse> recentResources;

}
