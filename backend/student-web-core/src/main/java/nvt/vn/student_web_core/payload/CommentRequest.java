package nvt.vn.student_web_core.payload;

import lombok.Data;

@Data
public class CommentRequest {
    private String content;
    private Integer parentId;

}
