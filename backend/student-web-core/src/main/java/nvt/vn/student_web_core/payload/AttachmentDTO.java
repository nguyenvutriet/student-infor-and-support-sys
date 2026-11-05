package nvt.vn.student_web_core.payload;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AttachmentDTO {

    private String fileId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private int fileSize;
    private LocalDateTime createAt;
    private Integer forumPostId;
}
