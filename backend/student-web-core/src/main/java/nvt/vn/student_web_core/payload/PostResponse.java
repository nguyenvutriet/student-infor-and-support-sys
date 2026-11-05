package nvt.vn.student_web_core.payload;

import lombok.Data;

import java.util.List;

@Data
public class PostResponse {

    private List<PostDTO> content;
    private Integer pageNumber;
    private Integer pageSize;
    private Long totalElements;
    private Integer totalPages;
    private boolean lastPage;
}
