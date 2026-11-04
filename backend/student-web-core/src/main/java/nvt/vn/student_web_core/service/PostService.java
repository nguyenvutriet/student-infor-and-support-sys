package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.PostResponse;

public interface PostService {

    PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy);
}
