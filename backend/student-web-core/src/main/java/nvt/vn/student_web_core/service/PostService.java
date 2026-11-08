package nvt.vn.student_web_core.service;

import nvt.vn.student_web_core.payload.CommentDTO;
import nvt.vn.student_web_core.payload.CommentRequest;
import nvt.vn.student_web_core.payload.PostDTO;
import nvt.vn.student_web_core.payload.PostResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

//    PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy);
//
//    PostDTO getPostById(Integer postId);

    @Transactional(readOnly = true)
    PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy, String userId);

    @Transactional(readOnly = true)
    PostDTO getPostById(Integer postId, String userId);

    PostDTO createPost(PostDTO req, String userId);

    PostDTO reactToPost(Integer postId, String reactionType, String userId);

    PostDTO deleteReactionOfPost(Integer postId, String userId);

    List<CommentDTO> getAllCommentByPostId(Integer postId, boolean isAdmin);

    CommentDTO createComment(Integer postId, CommentRequest request, String userId);

    PostDTO savePost(Integer postId, String userId);

    PostDTO unsavePost(Integer postId, String userId);

    PostResponse getSavedPosts(String userId, Integer pageNumber, Integer pageSize);

    PostDTO createPostWithFiles(String title, String content, List<MultipartFile> files, String userId);

    @Transactional(readOnly = true)
    PostResponse getHiddenPosts(
            String keyword,
            Integer pageNumber,
            Integer pageSize,
            String sortBy,
            String userId
    );
}
