package nvt.vn.student_web_core.payload;

import java.util.List;

public record DocumentRequest(
        String docNumber,
        String title,
        String content,
        String validity,   // PENDING | IN_EFFECT | EXPIRED (trống = IN_EFFECT)
        List<String> keepAttachmentIds,
        List<RelationRequest> relations) {
    public record RelationRequest(Integer docId, String type) {}
}