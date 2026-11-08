package nvt.vn.student_web_core.payload;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommentDTO {

    private Integer commentId;
    private String content;
    private String authorId;
    private Integer parentId;
    private String authorName;
    private String authorRole;
    private boolean active;

    private LocalDateTime createdAt;
    private List<CommentDTO> replies;

}
