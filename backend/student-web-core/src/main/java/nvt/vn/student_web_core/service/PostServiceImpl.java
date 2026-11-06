package nvt.vn.student_web_core.service;

import lombok.RequiredArgsConstructor;
import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.payload.*;
import nvt.vn.student_web_core.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final ForumPostRepo forumPostRepo;
    private final UserRepo userRepo;
    private final VoteRepo voteRepo;
    private final SavedPostRepo savedPostRepo;
    private final CommentRepo commentRepo;
    private final CloudinaryService cloudinaryService;

    private static final int MAX_TITLE = 200;
    private static final int MAX_CONTENT = 5000;
    private static final int MAX_COMMENT = 1000;
    private static final int MAX_FILES = 5;
    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 50L * 1024 * 1024;
    private static final long MAX_TOTAL_BYTES = 100L * 1024 * 1024;
    private static final Set<String> IMAGE_EXT = Set.of("png", "jpg", "jpeg", "gif", "webp");
    private static final Set<String> VIDEO_EXT = Set.of("mp4", "webm", "mov");
    private static final Set<String> DOC_EXT = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip");

    @Transactional(readOnly = true)
    @Override
    public PostResponse getAllPost(String keyword, Integer pageNumber, Integer pageSize, String sortBy, String userId) {

        Sort sort = "asc".equalsIgnoreCase(sortBy) ? Sort.by("createAt").ascending() : Sort.by("createAt").descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<ForumPost> spec = (root, q, cb) -> cb.equal(root.get("status"), ViewStatus.VISIBLE);
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("title")), kw));
        }

        Page<ForumPost> postPage = forumPostRepo.findAll(spec, pageable);

        List<PostDTO> postDTOs = postPage.getContent().stream()
                .map(post -> toDTO(post, userId))
                .toList();

        PostResponse response = new PostResponse();
        response.setContent(postDTOs);
        response.setPageNumber(postPage.getNumber());
        response.setPageSize(postPage.getSize());
        response.setTotalElements(postPage.getTotalElements());
        response.setTotalPages(postPage.getTotalPages());
        response.setLastPage(postPage.isLast());
        return response;
    }

    @Transactional(readOnly = true)
    @Override
    public PostDTO getPostById(Integer postId, String userId) {
        return toDTO(findVisiblePost(postId), userId);
    }

    @Override
    @Transactional
    public PostDTO createPost(PostDTO req, String userId) {
        return createPostWithFiles(req.getTitle(), req.getContent(), List.of(), userId);
    }

    // =====================================================================
    //  API #3 – Đăng bài kèm ảnh / GIF / video / tệp (multipart)
    // =====================================================================
    @Override
    @Transactional
    public PostDTO createPostWithFiles(String title, String content, List<MultipartFile> files, String userId) {

        // 1. Tiêu đề / nội dung (UC7 – Exc 6.1)
        if (title == null || title.isBlank() || content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ thông tin");
        }
        title = title.trim();
        content = content.trim();
        if (title.length() > MAX_TITLE || content.length() > MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề hoặc nội dung vượt quá độ dài cho phép");
        }

        // 2. Tệp đính kèm
        List<MultipartFile> validFiles = (files == null) ? List.of()
                : files.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (validFiles.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ đính kèm tối đa " + MAX_FILES + " tệp");
        }

        long total = 0;
        for (MultipartFile f : validFiles) {
            String ext = cloudinaryService.extension(f.getOriginalFilename());
            boolean video = VIDEO_EXT.contains(ext);
            if (!IMAGE_EXT.contains(ext) && !video && !DOC_EXT.contains(ext)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + f.getOriginalFilename() + "\" có định dạng không được hỗ trợ");
            }
            if (f.getSize() > (video ? MAX_VIDEO_BYTES : MAX_FILE_BYTES)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "\"" + f.getOriginalFilename() + "\" vượt quá " + (video ? "50MB" : "10MB"));
            }
            total += f.getSize();
        }
        if (total > MAX_TOTAL_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tổng dung lượng đính kèm vượt quá 100MB");
        }

        // 3. Tác giả + bài viết
        User author = findUser(userId);

        ForumPost post = new ForumPost();
        post.setTitle(title);
        post.setContent(content);
        post.setStatus(ViewStatus.VISIBLE);
        post.setCreateAt(LocalDateTime.now());
        post.setAuthor(author);
        post.setAttachments(new ArrayList<>());
        post.setVotes(new ArrayList<>());

        // 4. Upload từng tệp, lỗi giữa chừng thì xóa các tệp đã lên Cloudinary
        List<CloudinaryService.UploadedFile> uploaded = new ArrayList<>();
        try {
            for (MultipartFile f : validFiles) {
                CloudinaryService.UploadedFile up = cloudinaryService.uploadForum(f);
                uploaded.add(up);

                FileAttachment attachment = new FileAttachment();
                attachment.setFileId(UUID.randomUUID().toString());
                attachment.setFileName(f.getOriginalFilename());
                attachment.setFileUrl(up.url());
                attachment.setFileType(f.getContentType() != null ? f.getContentType() : up.resourceType() + "/" + up.format());
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
                    // không để lỗi dọn dẹp che mất lỗi gốc
                }
            }
            throw e;
        }
    }

    // =====================================================================
    //  API #4 – Thả / đổi cảm xúc (mỗi người một cảm xúc cho mỗi bài)
    // =====================================================================
    @Override
    @Transactional
    public PostDTO reactToPost(Integer postId, String reactionType, String userId) {

        ForumPost post = findVisiblePost(postId);
        User user = findUser(userId);

        VoteType type;
        try {
            type = VoteType.valueOf(reactionType.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cảm xúc không hợp lệ");
        }

        Vote vote = post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(userId))
                .findFirst()
                .orElseGet(() -> {
                    Vote n = new Vote();
                    n.setForumPost(post);
                    n.setUser(user);
                    post.getVotes().add(n);
                    return n;
                });
        vote.setVoteType(type);   // đã có thì chỉ đổi loại, không thêm bản ghi mới

        forumPostRepo.save(post);
        return toDTO(post, userId);
    }

    // =====================================================================
    //  API #5 – Bỏ cảm xúc (chưa có cảm xúc thì vẫn trả 200)
    // =====================================================================
    @Override
    @Transactional
    public PostDTO deleteReactionOfPost(Integer postId, String userId) {

        ForumPost post = findVisiblePost(postId);

        Optional<Vote> vote = post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(userId))
                .findFirst();

        if (vote.isPresent()) {
            post.getVotes().remove(vote.get());
            forumPostRepo.save(post);
            voteRepo.delete(vote.get());
        }
        return toDTO(post, userId);
    }

    // =====================================================================
    //  API #6 – Bình luận của bài viết (gốc → cũ nhất trước, kèm replies 1 cấp)
    // =====================================================================
    @Override
    @Transactional(readOnly = true)
    public List<CommentDTO> getAllCommentByPostId(Integer postId) {

        ForumPost post = findVisiblePost(postId);

        List<Comment> all = commentRepo.findByForumPostAndIsActiveTrue(post);
        if (all == null || all.isEmpty()) return List.of();

        Comparator<Comment> oldestFirst =
                Comparator.comparing(Comment::getCreateAt, Comparator.nullsLast(Comparator.naturalOrder()));

        List<Comment> roots = new ArrayList<>();
        Map<Integer, List<Comment>> repliesOfRoot = new LinkedHashMap<>();

        for (Comment c : all.stream().sorted(oldestFirst).toList()) {
            Comment root = rootOf(c);
            if (root == c) {
                roots.add(c);
            } else {
                repliesOfRoot.computeIfAbsent(root.getCommentId(), k -> new ArrayList<>()).add(c);
            }
        }

        return roots.stream().map(r -> {
            List<CommentDTO> replies = repliesOfRoot.getOrDefault(r.getCommentId(), List.of())
                    .stream().map(x -> toCommentDTO(x, List.of())).toList();
            return toCommentDTO(r, replies);
        }).toList();
    }

    // =====================================================================
    //  API #7 – Gửi bình luận / phản hồi
    // =====================================================================
    @Override
    @Transactional
    public CommentDTO createComment(Integer postId, CommentRequest request, String userId) {

        ForumPost post = findVisiblePost(postId);
        User user = findUser(userId);

        if (request == null || request.getContent() == null || request.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập nội dung bình luận");
        }
        if (request.getContent().trim().length() > MAX_COMMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bình luận không được vượt quá " + MAX_COMMENT + " ký tự");
        }

        Comment comment = new Comment();
        comment.setContent(request.getContent().trim());
        comment.setCreateAt(LocalDateTime.now());
        comment.setActive(true);
        comment.setForumPost(post);
        comment.setUser(user);

        if (request.getParentId() != null) {
            Comment parent = commentRepo.findById(request.getParentId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bình luận cha không tồn tại"));
            if (parent.getForumPost() == null || !postId.equals(parent.getForumPost().getPostId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bình luận cha không thuộc bài viết này");
            }
            comment.setParentComment(rootOf(parent));   // chỉ lồng 1 cấp: trả lời reply thì gắn vào bình luận gốc
        }

        return toCommentDTO(commentRepo.save(comment), List.of());
    }

    // =====================================================================
    //  API #8 – Lưu bài viết (gọi lại khi đã lưu thì không đổi gì)
    // =====================================================================
    @Override
    @Transactional
    public PostDTO savePost(Integer postId, String userId) {

        ForumPost post = findVisiblePost(postId);
        User user = findUser(userId);

        if (!savedPostRepo.existsByUser_UserIdAndForumPost_PostId(userId, postId)) {
            SavedPost savedPost = new SavedPost();
            savedPost.setForumPost(post);
            savedPost.setUser(user);
            savedPost.setCreateAt(LocalDateTime.now());   // SavedPost cần có trường createAt (dùng để sắp xếp ở API #10)
            post.getSavedPosts().add(savedPost);
            savedPostRepo.save(savedPost);
        }

        return toDTO(post, userId);
    }

    // =====================================================================
    //  API #9 – Bỏ lưu bài viết
    // =====================================================================
    @Override
    @Transactional
    public PostDTO unsavePost(Integer postId, String userId) {

        ForumPost post = findVisiblePost(postId);

        SavedPost savedPost = savedPostRepo.findByUser_UserIdAndForumPost_PostId(userId, postId);
        if (savedPost != null) {
            post.getSavedPosts().remove(savedPost);
            savedPostRepo.delete(savedPost);
            forumPostRepo.save(post);
        }

        return toDTO(post, userId);
    }

    // =====================================================================
    //  API #10 – Kho lưu trữ: bài đã lưu (mới lưu nhất trước, bỏ bài đã bị ẩn)
    // =====================================================================
    @Override
    @Transactional(readOnly = true)
    public PostResponse getSavedPosts(String userId, Integer pageNumber, Integer pageSize) {

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("createAt").descending());
        Page<SavedPost> savedPostPage = savedPostRepo.findByUser_UserId(userId, pageable);

        List<PostDTO> postDTOs = savedPostPage.getContent().stream()
                .map(SavedPost::getForumPost)
                .filter(p -> p != null && p.getStatus() == ViewStatus.VISIBLE)
                .map(p -> toDTO(p, userId))
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

    // =====================================================================
    //  Hàm dùng chung
    // =====================================================================

    /** Bài viết phải tồn tại và đang hiển thị, nếu không trả 404 (FE sẽ gỡ bài khỏi danh sách). */
    private ForumPost findVisiblePost(Integer postId) {
        return forumPostRepo.findById(postId)
                .filter(p -> p.getStatus() == ViewStatus.VISIBLE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bài viết không tồn tại hoặc đã bị xóa"));
    }

    private User findUser(String userId) {
        return userRepo.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
    }

    private String roleOf(User u) {
        return (u == null || u.getRole() == null) ? null : u.getRole().name().toLowerCase();   // student | staff | admin
    }

    private Comment rootOf(Comment c) {
        Comment cur = c;
        while (cur.getParentComment() != null) cur = cur.getParentComment();
        return cur;
    }

    private CommentDTO toCommentDTO(Comment c, List<CommentDTO> replies) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(c.getCommentId());
        dto.setContent(c.getContent());
        dto.setCreatedAt(c.getCreateAt());
        if (c.getUser() != null) {
            dto.setAuthorId(c.getUser().getUserId());
            dto.setAuthorName(c.getUser().getFullName());
            dto.setAuthorRole(roleOf(c.getUser()));
        }
        dto.setReplies(replies);
        return dto;
    }

    /**
     * Đổi ForumPost → PostDTO bằng tay (KHÔNG dùng ModelMapper: nó ghép nhầm danh sách savedPosts/votes... vào
     * các trường boolean/List của PostDTO và gây lỗi "PersistentBag to boolean").
     */
    private PostDTO toDTO(ForumPost post, String currentUserId) {
        PostDTO dto = new PostDTO();
        dto.setPostId(post.getPostId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setStatus(post.getStatus());
        dto.setCreateAt(post.getCreateAt());

        if (post.getAuthor() != null) {
            dto.setAuthorId(post.getAuthor().getUserId());
            dto.setAuthorName(post.getAuthor().getFullName());
            dto.setAuthorRole(roleOf(post.getAuthor()));
        }

        // Tệp đính kèm
        List<AttachmentDTO> attachments = post.getAttachments() == null ? List.of()
                : post.getAttachments().stream().map(f -> {
            AttachmentDTO d = new AttachmentDTO();
            d.setFileId(String.valueOf(f.getFileId()));
            d.setFileName(f.getFileName());
            d.setFileUrl(f.getFileUrl());
            d.setFileType(f.getFileType());
            d.setFileSize(f.getFileSize());
            d.setCreateAt(f.getCreateAt());
            d.setForumPostId(post.getPostId());
            return d;
        }).toList();
        dto.setAttachments(attachments);

        // Cảm xúc
        List<VoteDTO> votes = post.getVotes() == null ? List.of()
                : post.getVotes().stream().map(v -> {
            VoteDTO d = new VoteDTO();
            d.setVoteId(v.getVoteId());
            d.setUserId(v.getUser().getUserId());
            d.setPostId(post.getPostId());
            d.setReactionType(v.getVoteType().name());
            return d;
        }).toList();
        dto.setReactionSummary(votes);
        dto.setReactionCount((long) votes.size());
        dto.setMyReaction(post.getVotes() == null ? null : post.getVotes().stream()
                .filter(v -> v.getUser().getUserId().equals(currentUserId))
                .map(Vote::getVoteType)
                .findFirst().orElse(null));

        dto.setCommentCount(commentRepo.countByForumPostAndIsActiveTrue(post));
        dto.setSaved(savedPostRepo.existsByUser_UserIdAndForumPost_PostId(currentUserId, post.getPostId()));
        return dto;
    }
}