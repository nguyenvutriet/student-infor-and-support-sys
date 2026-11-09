package nvt.vn.student_web_core.controller.admin;

import nvt.vn.student_web_core.model.*;
import nvt.vn.student_web_core.repository.ReportRepo;
import jakarta.validation.Valid;
import nvt.vn.student_web_core.payload.admin.ResolveReportRequest;
import nvt.vn.student_web_core.repository.AdminRepo;

import nvt.vn.student_web_core.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import nvt.vn.student_web_core.repository.CommentRepo;

import nvt.vn.student_web_core.model.ForumPost;
import nvt.vn.student_web_core.model.ViewStatus;
import nvt.vn.student_web_core.repository.ForumPostRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

import nvt.vn.student_web_core.service.PostService;
import nvt.vn.student_web_core.util.AuthUtil;
import nvt.vn.student_web_core.config.AppConstants;
import nvt.vn.student_web_core.payload.PostResponse;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ReportRepo reportRepo;

    private final AdminRepo adminRepo;

    private final ForumPostRepo forumPostRepo;

    private final CommentRepo commentRepo;

    private final PostService postService;

    private final AuthUtil authUtil;

    private final NotificationService notificationService;

    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllReports() {

        List<Map<String, Object>> result = reportRepo.findAllReports()
                .stream()
                .map(report -> {

                    Map<String, Object> item = new HashMap<>();

                    item.put("reportId", report.getReportId());
                    item.put("reason", report.getReason());
                    item.put("adminNote", report.getAdminNote());
                    item.put("resolved", report.isResolved());
                    item.put("isViolation", report.isViolation());
                    item.put("createAt", report.getCreateAt());
                    item.put("handleAt", report.getHandleAt());

                    item.put("reporterName",
                            report.getStudent() != null
                                    ? report.getStudent().getFullName()
                                    : "Không xác định");

                    item.put("handledBy",
                            report.getHandledBy() != null
                                    ? report.getHandledBy().getFullName()
                                    : null);

                    // Báo cáo bài viết
                    if (report.getForumPost() != null
                            && report.getComment() == null) {

                        ForumPost post = report.getForumPost();

                        item.put("targetStatus", post.getStatus().name());

                        item.put(
                                "targetHidden",
                                post.getStatus() == ViewStatus.HIDDEN
                        );

                        item.put("reportType", "POST");
                        item.put("targetId", post.getPostId());
                        item.put("targetPostId", post.getPostId());
                        item.put("targetTitle", post.getTitle());
                        item.put("targetContent", post.getContent());

                        item.put("authorName",
                                post.getAuthor() != null
                                        ? post.getAuthor().getFullName()
                                        : "Không xác định");
                    }

                    // Báo cáo bình luận
                    else if (report.getComment() != null) {

                        Comment comment = report.getComment();

                        item.put("targetPostStatus",
                                comment.getForumPost() != null
                                        ? comment.getForumPost().getStatus().name()
                                        : null
                        );

                        item.put("targetStatus", comment.isActive());

                        // Trạng thái ẩn/hiện của bình luận
                        item.put("targetHidden", !comment.isActive());

                        // Trạng thái ẩn/hiện của bài viết chứa bình luận
                        item.put(
                                "targetPostHidden",
                                comment.getForumPost() != null &&
                                        comment.getForumPost().getStatus() == ViewStatus.HIDDEN
                        );

                        item.put("reportType", "COMMENT");
                        item.put("targetId", comment.getCommentId());
                        item.put("targetPostId",
                                comment.getForumPost() != null
                                        ? comment.getForumPost().getPostId()
                                        : null
                        );
                        item.put("targetContent", comment.getContent());

                        item.put("targetTitle",
                                comment.getForumPost() != null
                                        ? comment.getForumPost().getTitle()
                                        : null);

                        item.put("authorName",
                                comment.getUser() != null
                                        ? comment.getUser().getFullName()
                                        : "Không xác định");
                    }

                    return item;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/reports/{reportId}/resolve")
    @Transactional
    public ResponseEntity<?> resolveReport(
            @PathVariable Integer reportId,
            @Valid @RequestBody ResolveReportRequest request
    ) {

        Report report = reportRepo.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy báo cáo"
                ));

        if (report.isResolved()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Báo cáo này đã được xử lý"
            );
        }

        // Lấy ADMIN hiện tại
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        Admin admin = adminRepo.findById(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Tài khoản hiện tại không phải ADMIN"
                ));

        if (request.violation()) {

            // Chỉ ẩn nội dung khi ADMIN xác nhận vi phạm
            if (report.getForumPost() != null) {
                ForumPost post = report.getForumPost();
                post.setStatus(ViewStatus.HIDDEN);
                forumPostRepo.save(post);

            } else if (report.getComment() != null) {
                Comment comment = report.getComment();
                comment.setActive(false);
                commentRepo.save(comment);
            }
            if(report.getStaff() != null) {
                notificationService.send(report.getStaff().getUserId(), NotificationType.REPORT_RESOLVED_VIOLATION, "Báo cáo của bạn đã được xử lý. Nội dung vi phạm đã bị ẩn.");
            }else{
                notificationService.send(report.getStudent().getUserId(), NotificationType.REPORT_RESOLVED_VIOLATION, "Báo cáo của bạn đã được xử lý. Nội dung vi phạm đã bị ẩn.");
            }
        }else{
            notificationService.send(report.getStudent().getUserId() != null ? report.getStudent().getUserId() : report.getStaff().getUserId(), NotificationType.REPORT_RESOLVED_NO_VIOLATION, "Báo cáo của bạn đã được xử lý. Nội dung không vi phạm.");
        }

        // Cập nhật riêng báo cáo đang được xử lý
        report.setResolved(true);
        report.setViolation(request.violation());
        report.setAdminNote(request.adminNote());
        report.setHandleAt(LocalDateTime.now());
        report.setHandledBy(admin);

        reportRepo.save(report);

        return ResponseEntity.ok(
                java.util.Map.of(
                        "message", "Xử lý báo cáo thành công",
                        "reportId", report.getReportId(),
                        "resolved", report.isResolved()
                )
        );
    }

    @PatchMapping("/forum/posts/{postId}/hide")
    public ResponseEntity<?> hideForumPost(
            @PathVariable Integer postId
    ) {
        ForumPost post = forumPostRepo.findById(postId)
                .orElse(null);

        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        if (post.getStatus() == ViewStatus.HIDDEN) {
            return ResponseEntity.ok(
                    Map.of("message", "Bài viết đã được ẩn trước đó.")
            );
        }

        post.setStatus(ViewStatus.HIDDEN);
        forumPostRepo.save(post);
        notificationService.send(post.getAuthor().getUserId(), NotificationType.POST_HIDDEN, "Bài viết của bạn đã bị ẩn do vi phạm nội quy.");
        return ResponseEntity.ok(
                Map.of("message", "Ẩn bài viết thành công.")
        );
    }

    @PatchMapping("/forum/comments/{commentId}/hide")
    @Transactional
    public ResponseEntity<?> hideForumComment(
            @PathVariable Integer commentId
    ) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy bình luận"
                ));

        if (!comment.isActive()) {
            return ResponseEntity.ok(
                    Map.of("message", "Bình luận đã được ẩn trước đó.")
            );
        }

        comment.setActive(false);
        commentRepo.save(comment);

        return ResponseEntity.ok(
                Map.of("message", "Ẩn bình luận thành công.")
        );
    }

    @PatchMapping("/forum/comments/{commentId}/restore")
    @Transactional
    public ResponseEntity<?> restoreForumComment(
            @PathVariable Integer commentId
    ) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bình luận"
                ));

        comment.setActive(true);
        commentRepo.save(comment);

        return ResponseEntity.ok(
                Map.of("message", "Hiện bình luận thành công.")
        );
    }

    @GetMapping("/forum/posts/hidden")
    public ResponseEntity<PostResponse> getHiddenPosts(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = AppConstants.PAGE_SIZE) Integer pageSize,
            @RequestParam(name = "sortBy", defaultValue = AppConstants.SORT_DIR) String sortBy
    ) {
        String userId = authUtil.loggedInUser().getUserId();

        PostResponse response = postService.getHiddenPosts(
                keyword, pageNumber, pageSize, sortBy, userId
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/forum/posts/{postId}/restore")
    @Transactional
    public ResponseEntity<?> restoreForumPost(
            @PathVariable Integer postId
    ) {
        ForumPost post = forumPostRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy bài viết"
                ));

        if (post.getStatus() == ViewStatus.VISIBLE) {
            return ResponseEntity.ok(
                    Map.of("message", "Bài viết đang được hiển thị.")
            );
        }

        post.setStatus(ViewStatus.VISIBLE);
        forumPostRepo.save(post);

        return ResponseEntity.ok(
                Map.of("message", "Hiện bài viết thành công.")
        );
    }
}