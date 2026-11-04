package nvt.vn.student_web_core.controller.common;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.config.AppConstants;
import nvt.vn.student_web_core.payload.PostResponse;
import nvt.vn.student_web_core.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final PostService postService;

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
}
