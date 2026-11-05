package nvt.vn.student_web_core.payload;

import lombok.Data;

@Data
public class VoteDTO {

    private Integer voteId;
    private String userId;
    private Integer postId;
    private String reactionType;
}
