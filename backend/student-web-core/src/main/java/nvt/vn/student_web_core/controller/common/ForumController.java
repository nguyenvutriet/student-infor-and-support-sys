package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.config.AppConstants;
import nvt.vn.student_web_core.payload.PostDTO;
import nvt.vn.student_web_core.payload.PostResponse;
import nvt.vn.student_web_core.service.PostService;
import nvt.vn.student_web_core.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final PostService postService;
    private final AuthUtil authUtil;

    @GetMapping("/posts")
    public ResponseEntity<PostResponse> getPosts(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER, required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = AppConstants.PAGE_SIZE, required = false) Integer pageSize,
            @RequestParam(name = "sortBy", defaultValue = AppConstants.SORT_PRODUCTS_BY, required = false) String sortBy
    ){

        PostResponse postResponse = postService.getAllPost(keyword, pageNumber, pageSize, sortBy);

        return new ResponseEntity<>(postResponse, HttpStatus.OK);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDTO> getPost(@PathVariable Integer postId){

        PostDTO postDTO = postService.getPostById(postId);

        return new ResponseEntity<>(postDTO, HttpStatus.OK);
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDTO> createPost(@RequestBody PostDTO postDTO){

        PostDTO createdPost = postService.createPost(postDTO);

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




}
