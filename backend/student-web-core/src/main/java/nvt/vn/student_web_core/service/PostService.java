package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.PostDTO;
import nvt.vn.student_web_core.payload.PostResponse;

public interface PostService {

    PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy);

    PostDTO getPostById(Integer postId);

    PostDTO createPost(PostDTO postDTO);

    PostDTO reactToPost(Integer postId, String reactionType, String userId);

    PostDTO deleteReactionOfPost(Integer postId, String userId);
}
