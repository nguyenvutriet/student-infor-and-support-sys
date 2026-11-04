package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.ForumPost;
import nvt.vn.student_web_core.payload.PostResponse;
import nvt.vn.student_web_core.repository.ForumPostRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final ForumPostRepo forumPostRepo;

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

        // 06/11/2026 làm tiếp ở đây


        return null;
    }
}
