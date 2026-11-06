package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.config.AppConstants;
import nvt.vn.student_web_core.payload.*;
import nvt.vn.student_web_core.service.PostService;
import nvt.vn.student_web_core.service.ReportService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final PostService postService;
    private final AuthUtil authUtil;
    private final ReportService reportService;

    @GetMapping("/posts")
    public ResponseEntity<PostResponse> getPosts(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER, required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = AppConstants.PAGE_SIZE, required = false) Integer pageSize,
            @RequestParam(name = "sortBy", defaultValue = AppConstants.SORT_DIR, required = false) String sortBy
    ){

        PostResponse postResponse = postService.getAllPost(keyword, pageNumber, pageSize, sortBy, authUtil.loggedInUser().getUserId());

        return new ResponseEntity<>(postResponse, HttpStatus.OK);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDTO> getPost(@PathVariable Integer postId){

        PostDTO postDTO = postService.getPostById(postId, authUtil.loggedInUser().getUserId());

        return new ResponseEntity<>(postDTO, HttpStatus.OK);
    }

    @PostMapping(value = "/posts", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PostDTO> createPost(@RequestBody PostDTO postDTO){

        PostDTO createdPost = postService.createPost(postDTO, authUtil.loggedInUser().getUserId());

        return new ResponseEntity<>(createdPost, HttpStatus.CREATED);
    }

    @PutMapping("/posts/{postId}/reaction")
    public ResponseEntity<PostDTO> reactPost(@PathVariable Integer postId, @RequestParam String reactionType) {
        String userId = authUtil.loggedInUser().getUserId();
        PostDTO updatedPost = postService.reactToPost(postId, reactionType, userId);
        return new ResponseEntity<>(updatedPost, HttpStatus.OK);
    }

    @DeleteMapping("/posts/{postId}/reaction")
    public ResponseEntity<PostDTO> delPostReaction(@PathVariable Integer postId) {
        String userId = authUtil.loggedInUser().getUserId();
        PostDTO updatedPost = postService.deleteReactionOfPost(postId, userId);
        return new ResponseEntity<>(updatedPost, HttpStatus.OK);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentDTO>> getPostComments(@PathVariable Integer postId){
        List<CommentDTO> comments = postService.getAllCommentByPostId(postId);
        return new ResponseEntity<>(comments, HttpStatus.OK);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDTO> createComment(@PathVariable Integer postId, @RequestBody CommentRequest request) {
        String userId = authUtil.loggedInUser().getUserId();
        CommentDTO createdComment = postService.createComment(postId, request, userId);
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    @PostMapping("/posts/{postId}/save")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF')")
    public ResponseEntity<PostDTO> savePost(@PathVariable Integer postId) {
        String userId = authUtil.loggedInUser().getUserId();
        PostDTO updatedPost = postService.savePost(postId, userId);
        return new ResponseEntity<>(updatedPost, HttpStatus.OK);
    }

    @DeleteMapping("/posts/{postId}/save")
    public ResponseEntity<PostDTO> unsavePost(@PathVariable Integer postId) {
        String userId = authUtil.loggedInUser().getUserId();
        PostDTO updatedPost = postService.unsavePost(postId, userId);
        return new ResponseEntity<>(updatedPost, HttpStatus.OK);
    }

    @GetMapping("/saved")
    @PreAuthorize("hasAnyRole('STUDENT','STAFF')")
    public ResponseEntity<PostResponse> getSavedPosts(
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER, required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = AppConstants.PAGE_SIZE, required = false) Integer pageSize){
        PostResponse savedPosts = postService.getSavedPosts(authUtil.loggedInUser().getUserId(), pageNumber, pageSize);
        return new ResponseEntity<>(savedPosts, HttpStatus.OK);
    }

    @PostMapping("/reports")
    public ResponseEntity<ReportResponse> reportPostorComment(@RequestBody ReportRequest request){

        String userId = authUtil.loggedInUser().getUserId();
        ReportResponse reportResponse = reportService.reportPostOrComment(request, userId);
        return new ResponseEntity<>(reportResponse, HttpStatus.CREATED);
    }

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDTO> createPostWithFiles(@RequestParam String title,
                                                       @RequestParam String content,
                                                       @RequestParam(required = false) List<MultipartFile> files) {
        String userId = authUtil.loggedInUser().getUserId();
        PostDTO created = postService.createPostWithFiles(title, content, files, userId);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }



}
