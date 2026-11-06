package nvt.vn.student_web_core.payload;

import lombok.Data;
import nvt.vn.student_web_core.model.ViewStatus;
import nvt.vn.student_web_core.model.VoteType;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostDTO {
    private Integer postId;
    private String title;
    private String content;
    private ViewStatus status;
    private String authorId;
    private String authorName;
    private String authorRole;
    private List<AttachmentDTO> attachments;
    private Long reactionCount;
    private List<VoteDTO> reactionSummary;
    private VoteType myReaction;
    private Long commentCount;
    private boolean saved;
    private List<CommentDTO> comments;
    private LocalDateTime createAt;
    private LocalDateTime savedAt;
}
