package nvt.vn.student_web_core.payload;

import java.time.LocalDateTime;
import java.util.List;

public record DocumentResponse(
        Integer id, String docNumber, String title, String content,
        LocalDateTime createAt, LocalDateTime updateAt, String status,
        String validity, String selectedValidity,
        String department, String staffName,
        List<Attachment> attachments, List<Relation> relations) {
    public record Attachment(String id, String name, long size, String url, String fileType) {}
    public record Relation(Integer docId, String type, String title, String docNumber, boolean incoming) {}
}