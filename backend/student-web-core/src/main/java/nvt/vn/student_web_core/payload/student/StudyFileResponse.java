package nvt.vn.student_web_core.payload.student;

import lombok.Data;

@Data
public class StudyFileResponse {

    private String fileId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private int fileSize;

}
