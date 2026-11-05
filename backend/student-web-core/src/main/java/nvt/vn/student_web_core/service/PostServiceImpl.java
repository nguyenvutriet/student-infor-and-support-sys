package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.ForumPost;
import nvt.vn.student_web_core.model.User;
import nvt.vn.student_web_core.model.Vote;
import nvt.vn.student_web_core.model.VoteType;
import nvt.vn.student_web_core.payload.PostDTO;
import nvt.vn.student_web_core.payload.PostResponse;
import nvt.vn.student_web_core.repository.ForumPostRepo;
import nvt.vn.student_web_core.repository.UserRepo;
import nvt.vn.student_web_core.repository.VoteRepo;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final ForumPostRepo forumPostRepo;
    private final ModelMapper modelMapper;
    private final UserRepo userRepo;
    private final VoteRepo voteRepo;

    @Override
    public PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy) {

        Sort sort = sortBy.equals("asc") ? Sort.by("createdAt").ascending() : Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<ForumPost> spec = Specification.unrestricted();
        if(keyword != null && !keyword.isEmpty()){
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.or(
                            criteriaBuilder.like(root.get("title"), "%" + keyword + "%")
                    )
            );
        }

        Page<ForumPost> postPage = forumPostRepo.findAll(spec, pageable);

        List<ForumPost> posts = postPage.getContent();
        List<PostDTO> postDTOs = posts.stream()
                .map(
                        post -> {
                            PostDTO postDTO = modelMapper.map(post, PostDTO.class);
                            return postDTO;
                        }
                ).toList();

        PostResponse response = new PostResponse();
        response.setContent(postDTOs);
        response.setPageNumber(postPage.getNumber());
        response.setPageSize(postPage.getSize());
        response.setTotalElements(postPage.getTotalElements());
        response.setTotalPages(postPage.getTotalPages());
        response.setLastPage(postPage.isLast());

        return response;
    }

    @Override
    public PostDTO getPostById(Integer postId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        PostDTO postDTO = modelMapper.map(post, PostDTO.class);
        return postDTO;
    }

    @Override
    public PostDTO createPost(PostDTO postDTO) {

        ForumPost post = modelMapper.map(postDTO, ForumPost.class);
        forumPostRepo.save(post);


        return null;
    }

    @Override
    public PostDTO reactToPost(Integer postId, String reactionType, String userId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        Vote vote = new Vote();
        vote.setForumPost(post);
        vote.setVoteType(VoteType.valueOf(reactionType));

        User user = userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Người dùng không tồn tại")
        );
        vote.setUser(user);

        post.getVotes().add(vote);
        forumPostRepo.save(post);

        return modelMapper.map(post, PostDTO.class);
    }

    @Override
    public PostDTO deleteReactionOfPost(Integer postId, String userId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        Vote vote = post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Người dùng chưa phản ứng với bài viết này"));

        post.getVotes().remove(vote);
        forumPostRepo.save(post);
        voteRepo.delete(vote);

        return modelMapper.map(post, PostDTO.class);
    }


}
