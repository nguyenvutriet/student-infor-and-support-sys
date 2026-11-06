package nvt.vn.student_web_core.payload.chat;

import java.time.LocalDateTime;
import java.util.List;

/** Các DTO của chức năng nhắn tin / yêu cầu hỗ trợ. */
public final class ChatDto {
    private ChatDto() {}

    public record DepartmentOption(String id, String name) {}

    public record RequestSummary(Integer requestId, String subject, String status,
                                 LocalDateTime createdAt, LocalDateTime updatedAt,
                                 String studentId, String studentName,
                                 String departmentId, String departmentName, boolean deletable) {}

    public record HistoryItem(String action, String status, LocalDateTime time,
                              String actorName, String departmentName, String note) {}

    public record Permissions(boolean canAccept, boolean canReject, boolean canForward,
                              boolean canInvite, boolean canClose, boolean canSend, boolean canDelete) {}

    public record RequestDetail(Integer requestId, String subject, String description, String status,
                                LocalDateTime createdAt, LocalDateTime updatedAt,
                                String studentId, String studentName,
                                String departmentId, String departmentName,
                                String handlerId, String handlerName,
                                String rejectReason, String closeNote,
                                List<DepartmentOption> invitedDepartments,
                                List<HistoryItem> histories,
                                String access, Permissions permissions) {}

    public record AttachmentDto(String fileId, String fileName, String fileUrl, String fileType, int fileSize) {}

    public record MessageDto(Integer messId, Integer requestId, String senderId, String senderName,
                             String senderRole, String type, String content, LocalDateTime sendAt,
                             boolean recalled, List<AttachmentDto> attachments) {}

    public record CreateRequestBody(String departmentId, String subject, String description) {}
    public record RejectBody(String reason) {}
    public record ForwardBody(String departmentId, String note) {}
    public record InviteBody(List<String> departmentIds, String message) {}
    public record CloseBody(String note) {}

    /** Sự kiện đẩy qua WebSocket: type = REQUEST_CREATED | REQUEST_CHANGED | REQUEST_DELETED | MESSAGE_CREATED | MESSAGE_RECALLED. */
    public record ChatEvent(String type, Integer requestId, Object payload) {}
}