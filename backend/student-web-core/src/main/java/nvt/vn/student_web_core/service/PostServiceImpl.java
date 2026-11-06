package nvt.vn.student_web_core.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.*;
import nvt.vn.student_web_core.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final ForumPostRepo forumPostRepo;
    private final ModelMapper modelMapper;
    private final UserRepo userRepo;
    private final VoteRepo voteRepo;
    private final SavedPostRepo savedPostRepo;
    private final CommentRepo commentRepo;
    private final CloudinaryService cloudinaryService;

    private static final int MAX_TITLE = 200;
    private static final int MAX_CONTENT = 5000;
    private static final int MAX_FILES = 5;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> POST_ALLOWED_EXT = Set.of(
            "png", "jpg", "jpeg", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip");

    @Override
    public PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy) {

        Sort sort = sortBy.equals("asc") ? Sort.by("createAt").ascending() : Sort.by("createAt").descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<ForumPost> spec = (root, q, cb) -> cb.equal(root.get("status"), ViewStatus.VISIBLE);
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("title")), kw));
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
    public PostDTO createPost(PostDTO req, String userId) {
        if (req.getTitle() == null || req.getTitle().isBlank()
                || req.getContent() == null || req.getContent().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ thông tin");

        ForumPost post = new ForumPost();
        post.setTitle(req.getTitle().trim());
        post.setContent(req.getContent().trim());
        post.setStatus(ViewStatus.VISIBLE);
        post.setCreateAt(LocalDateTime.now());
        post.setAuthor(userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Người dùng không tồn tại")
        ));
        return toDTO(forumPostRepo.save(post), userId);
    }


    @Override
    public PostDTO reactToPost(Integer postId, String reactionType, String userId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        User user = userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Người dùng không tồn tại")
        );

        VoteType type;
        try { type = VoteType.valueOf(reactionType.toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cảm xúc không hợp lệ");
        }
        Vote vote = post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(userId)).findFirst()
                .orElseGet(() -> { Vote n = new Vote(); n.setForumPost(post); n.setUser(user); post.getVotes().add(n); return n; });
        vote.setVoteType(type);
        forumPostRepo.save(post);
        return toDTO(post, userId);
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

    @Override
    public List<CommentDTO> getAllCommentByPostId(Integer postId) {

        ForumPost post =  forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        List<Comment> comments = commentRepo.findByForumPostAndIsActiveTrue(post);
        if (comments != null && !comments.isEmpty()) {
            return comments.stream().map(c -> {
                CommentDTO dto = modelMapper.map(c, CommentDTO.class);
                dto.setAuthorId(c.getUser().getUserId());
                dto.setAuthorName(c.getUser().getFullName());
                dto.setAuthorRole(c.getUser().getRole().name().toLowerCase());
                return dto;
            }).toList();
        }
        return List.of();
    }

    @Override
    public CommentDTO createComment(Integer postId, CommentRequest request, String userId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        User user = userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Người dùng không tồn tại")
        );

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setCreateAt(LocalDateTime.now());
        comment.setActive(true);
        comment.setForumPost(post);
        comment.setUser(user);

        if (request.getParentId() != null) {
            Comment parentComment = commentRepo.findById(request.getParentId()).orElseThrow(
                    () -> new RuntimeException("Bình luận cha không tồn tại")
            );
            comment.setParentComment(parentComment);
        }

        return modelMapper.map(commentRepo.save(comment), CommentDTO.class);
    }

    @Override
    public PostDTO savePost(Integer postId, String userId) {

        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        User user = userRepo.findById(userId).orElseThrow(
                () -> new RuntimeException("Người dùng không tồn tại")
        );

        boolean isSaved = savedPostRepo.existsByUser_UserIdAndForumPost_PostId(userId, postId);
        if (isSaved) {
            SavedPost savedPost = savedPostRepo.findByUser_UserIdAndForumPost_PostId(userId, postId);
            post.getSavedPosts().remove(savedPost);
            savedPostRepo.delete(savedPost);
        } else {
            SavedPost savedPost = new SavedPost();
            savedPost.setForumPost(post);
            savedPost.setUser(user);
            post.getSavedPosts().add(savedPost);
            savedPostRepo.save(savedPost);
        }

        forumPostRepo.save(post);

        return toDTO(post, userId);
    }

    @Override
    public PostDTO unsavePost(Integer postId, String userId) {
        ForumPost post = forumPostRepo.findById(postId).orElseThrow(
                () -> new RuntimeException("Bài viết không tồn tại hoặc đã bị xóa")
        );

        SavedPost savedPost = savedPostRepo.findByUser_UserIdAndForumPost_PostId(userId, postId);
        if (savedPost != null) {
            post.getSavedPosts().remove(savedPost);
            savedPostRepo.delete(savedPost);
            forumPostRepo.save(post);
        }

        return toDTO(post, userId);
    }

    @Override
    public PostResponse getSavedPosts(String userId, Integer pageNumber, Integer pageSize) {
        Sort sort = Sort.by("createAt").descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<SavedPost> savedPostPage = savedPostRepo.findByUser_UserId(userId, pageable);

        List<PostDTO> postDTOs = savedPostPage.getContent().stream()
                .map(savedPost -> toDTO(savedPost.getForumPost(), userId))
                .toList();

        PostResponse response = new PostResponse();
        response.setContent(postDTOs);
        response.setPageNumber(savedPostPage.getNumber());
        response.setPageSize(savedPostPage.getSize());
        response.setTotalElements(savedPostPage.getTotalElements());
        response.setTotalPages(savedPostPage.getTotalPages());
        response.setLastPage(savedPostPage.isLast());

        return response;
    }

    @Override
    @Transactional
    public PostDTO createPostWithFiles(String title, String content, List<MultipartFile> files, String userId) {

        if (title == null || title.isBlank() || content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ thông tin");
        }
        title = title.trim();
        content = content.trim();
        if (title.length() > MAX_TITLE || content.length() > MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề hoặc nội dung vượt quá độ dài cho phép");
        }

        List<MultipartFile> validFiles = (files == null) ? List.of()
                : files.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (validFiles.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ đính kèm tối đa " + MAX_FILES + " tệp");
        }
        for (MultipartFile f : validFiles) {
            if (f.getSize() > MAX_FILE_SIZE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + f.getOriginalFilename() + "\" vượt quá 10MB");
            }
            String ext = cloudinaryService.extension(f.getOriginalFilename());
            if (!POST_ALLOWED_EXT.contains(ext)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + f.getOriginalFilename() + "\" có định dạng không được hỗ trợ");
            }
        }

        User author = userRepo.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        ForumPost post = new ForumPost();
        post.setTitle(title);
        post.setContent(content);
        post.setStatus(ViewStatus.VISIBLE);
        post.setCreateAt(LocalDateTime.now());
        post.setAuthor(author);
        post.setAttachments(new ArrayList<>());
        post.setVotes(new ArrayList<>());

        List<CloudinaryService.UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile f : validFiles) {
                CloudinaryService.UploadedFile up = cloudinaryService.uploadChat(f);
                uploaded.add(up);

                FileAttachment attachment = new FileAttachment();
                attachment.setFileName(f.getOriginalFilename());
                attachment.setFileUrl(up.url());
                attachment.setFileType(f.getContentType());
                attachment.setFileSize((int) up.bytes());
                attachment.setCreateAt(LocalDateTime.now());
                attachment.setForumPost(post);
                post.getAttachments().add(attachment);
            }

            ForumPost saved = forumPostRepo.save(post);
            return toDTO(saved, userId);

        } catch (RuntimeException e) {
            for (CloudinaryService.UploadedFile up : uploaded) {
                try {
                    cloudinaryService.delete(up.publicId(), up.resourceType());
                } catch (Exception ignored) {
                }
            }
            throw e;
        }
    }

    private PostDTO toDTO(ForumPost post, String currentUserId) {
        PostDTO dto = modelMapper.map(post, PostDTO.class);
        dto.setAuthorId(post.getAuthor().getUserId());
        dto.setAuthorName(post.getAuthor().getFullName());
        dto.setAuthorRole(post.getAuthor().getRole().name().toLowerCase());

        List<VoteDTO> votes = post.getVotes().stream().map(v -> {
            VoteDTO d = new VoteDTO();
            d.setVoteId(v.getVoteId());
            d.setUserId(v.getUser().getUserId());
            d.setPostId(post.getPostId());
            d.setReactionType(v.getVoteType().name());
            return d;
        }).toList();
        dto.setReactionSummary(votes);
        dto.setReactionCount((long) votes.size());
        dto.setMyReaction(post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(currentUserId))
                .map(Vote::getVoteType).findFirst().orElse(null));
        dto.setCommentCount(commentRepo.countByForumPostAndIsActiveTrue(post));
        dto.setSaved(savedPostRepo.existsByUser_UserIdAndForumPost_PostId(currentUserId, post.getPostId()));
        return dto;
    }



}
