package nvt.vn.student_web_core.payload.student;

import lombok.Data;

@Data
public class DepartmentSummaryResponse {

    private String departmentId;
    private String name;
    private String description;
    private String email;
    private String phone;
    private String location;
    private String logoUrl;
    private long examCount;
    private long documentCount;

}
