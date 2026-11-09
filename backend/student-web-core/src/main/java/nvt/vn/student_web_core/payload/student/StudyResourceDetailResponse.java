package nvt.vn.student_web_core.payload.student;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StudyResourceDetailResponse {

    private Integer resourceId;
    private String title;
    private String description;
    private LocalDateTime createAt;
    private boolean isNew;
    private String departmentId;
    private String departmentName;
    private List<StudyFileResponse> files;
    private String authorName;

}
